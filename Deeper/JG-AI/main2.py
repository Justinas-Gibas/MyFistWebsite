#!/usr/bin/env python3
"""
Expanded Version: Modular AI Training Tool with Enhanced UI & Visualization
 - Real-time Evaluation: Plot Q_value history over time & live mental screen updates.
 - Handwriting Annotation: A canvas for drawing digits and annotating them as training samples.
 - Modular design: New tabs can be added (e.g., model layer editor, dataset integration) as needed.
 - Future placeholders for advanced UI components (e.g., drag & drop NN layer building for kids).
 
Requirements:
  - Python 3.8+
  - Libraries: torch, torchvision, torchaudio, matplotlib, python-dotenv,
    openai, opencv-python-headless, numpy, Pillow, tkinter/ttk.
  - .env file with OPENAI_API_KEY.
"""

import os
import json
import datetime
import random
import math
import time
import io
from typing import Dict, Any
import threading

import torch
import torch.nn as nn
import matplotlib
matplotlib.use("Agg")  # Use a non-blocking backend for matplotlib
import matplotlib.pyplot as plt

import numpy as np
import cv2

from dotenv import load_dotenv
import openai

import tkinter as tk
from tkinter import ttk, scrolledtext, simpledialog, Canvas, messagebox
from PIL import Image, ImageTk, ImageDraw

# =============================================================================
# Load Environment Variables and API Key
# =============================================================================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found in .env file.")
openai.api_key = OPENAI_API_KEY

# =============================================================================
# Configuration Dictionary
# =============================================================================
CONFIG = {
    "latent_space": {
        "height": 16,
        "width": 16,
        "channels": 3,
        "time_dim": 1,
        "embed_dim": 128,
        "num_detection_classes": 10,
        # Placeholders for extended mental screens:
        "mental_screen_2d_height": 64,
        "mental_screen_2d_width": 64,
        # Future placeholders for 3D / 4D
    },
    "training": {
        "initial_decay_rate": 0.01,
        "desired_performance": 0.9,
        "max_iterations": 10,
        "learning_rate": 0.001,
    },
    "gpt": {
        "basic_stage": "basic_arithmetic",
        "advanced_stage": "advanced_algebra",
        "max_tokens": 150,
        "temperature": 0.7,
    }
}

# =============================================================================
# Enhanced Latent Space: 2D (with placeholders for 3D & 4D)
# =============================================================================
class EnhancedLatentSpace(nn.Module):
    """
    Enhanced latent space module that can embed data into 2D, with placeholders
    for 3D and 4D expansions.
    """
    def __init__(self, config: Dict[str, Any]):
        super(EnhancedLatentSpace, self).__init__()
        self.height = config["height"]
        self.width = config["width"]
        self.channels = config["channels"]
        self.embed_dim = config["embed_dim"]
        self.time_dim = config["time_dim"]
        self.flatten_dim = self.height * self.width * self.channels

        # 2D mental screen (larger than height/width)
        ms_h = config.get("mental_screen_2d_height", 64)
        ms_w = config.get("mental_screen_2d_width", 64)
        self.mental_screen_2d = nn.Parameter(torch.randn(ms_h, ms_w))

        # Core 2D embedding
        self.spatial_2d_embedding = nn.Parameter(torch.randn(self.height, self.width, self.embed_dim))
        # Placeholders for 3D, 4D (not used, but structure remains open)
        self.spatial_3d_embedding = None
        self.spatial_4d_embedding = None

        # Time embedding
        self.time_embedding = nn.Parameter(torch.randn(self.time_dim, self.embed_dim))

        # Linear mapping from flattened input
        self.latent_embedding = nn.Linear(self.flatten_dim, self.embed_dim)

        # Optionally add a CNN-based YOLO-like detection head
        self.use_cnn = False
        if self.use_cnn:
            self.cnn_head = nn.Sequential(
                nn.Conv2d(self.channels, 16, kernel_size=3, stride=1, padding=1),
                nn.ReLU(),
                nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1),
                nn.ReLU(),
                nn.Flatten()
            )
            cnn_out_dim = self.height * self.width * 32
            self.yolo_head = nn.Linear(cnn_out_dim + self.embed_dim * 2, config["num_detection_classes"])
        else:
            self.yolo_head = nn.Linear(self.embed_dim * 3, config["num_detection_classes"])

    def forward(self, x: torch.Tensor, time_index: int = 0) -> torch.Tensor:
        batch_size = x.size(0)
        flattened = x.view(batch_size, -1)
        latent_embed = self.latent_embedding(flattened)

        # Mean over the provided 2D embedding
        spatial_2d = self.spatial_2d_embedding.view(-1, self.embed_dim).unsqueeze(0).repeat(batch_size, 1, 1)
        spatial_mean = spatial_2d.mean(dim=1)

        # Time embedding
        if time_index >= self.time_dim:
            raise ValueError(f"time_index ({time_index}) out of range (max {self.time_dim})")
        time_embed = self.time_embedding[time_index].unsqueeze(0).repeat(batch_size, 1)

        # Combine features
        if self.use_cnn:
            x_cnn = self.cnn_head(x)
            combined = torch.cat((x_cnn, latent_embed, spatial_mean, time_embed), dim=1)
        else:
            combined = torch.cat((latent_embed, spatial_mean, time_embed), dim=1)

        detection_logits = self.yolo_head(combined)
        return detection_logits

    def get_mental_screen_2d_as_image(self) -> Image.Image:
        """
        Convert the mental_screen_2d to a PIL Image (grayscale) for UI display.
        """
        with torch.no_grad():
            screen_data = self.mental_screen_2d.clone().cpu().numpy()
            screen_data = (screen_data - screen_data.min()) / (screen_data.max() - screen_data.min() + 1e-9)
            screen_data *= 255.0
            screen_data = screen_data.astype(np.uint8)
            pil_img = Image.fromarray(screen_data, mode='L')
        return pil_img

    def neuron_decay(self, decay_rate: float):
        """
        Applies decay to simulate forgetting.
        """
        with torch.no_grad():
            self.latent_embedding.weight.mul_(1.0 - decay_rate)
            self.spatial_2d_embedding.mul_(1.0 - decay_rate)
            self.time_embedding.mul_(1.0 - decay_rate)
            self.mental_screen_2d.mul_(1.0 - decay_rate)
            if self.use_cnn:
                for param in self.cnn_head.parameters():
                    param.mul_(1.0 - decay_rate)
        print(f"Neuron decay applied with decay rate: {decay_rate:.4f}")

# =============================================================================
# RL-based Adaptive Forgetting Speed (Placeholder)
# =============================================================================
def rl_adaptive_forgetting_speed(current_performance: float,
                                 desired_performance: float,
                                 current_decay_rate: float) -> float:
    """
    Placeholder RL-based approach for adaptive forgetting speed.
    """
    if current_performance < desired_performance:
        new_decay_rate = max(current_decay_rate * 0.9, 0.001)
    else:
        new_decay_rate = min(current_decay_rate * 1.1, 0.1)
    print(f"Decay rate adapted from {current_decay_rate:.4f} to {new_decay_rate:.4f} (RL-based placeholder).")
    return new_decay_rate

# =============================================================================
# Self-Reinforcing Environment
# =============================================================================
class SelfReinforcingEnvironment:
    """
    Environment for rStar-Math self-evolution.
    It runs training iterations, logs Q_value and dynamic loss history,
    and collects data for later evaluation.
    """
    def __init__(self, latent_model: EnhancedLatentSpace, decay_rate: float):
        self.latent_model = latent_model
        self.decay_rate = decay_rate
        self.iteration = 0
        self.dynamic_loss = 1.0
        self.latest_q_value = 0.0  # for UI display
        self.q_history = []  # history for plotting

    def collect_in_knowledge_data(self) -> str:
        data_path = os.path.join("training_data", f"data_iter_{self.iteration}.json")
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        sample_data = {
            "iteration": self.iteration,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "sensor_data": f"sample reading {random.random()}"
        }
        with open(data_path, "w") as f:
            json.dump(sample_data, f)
        print(f"In-knowledge data collected at: {data_path}")
        return data_path

    def mcts_guided_reasoning(self) -> Dict[str, Any]:
        """
        Stub for improved MCTS-based reasoning.
        """
        candidates = []
        for i in range(5):
            candidate = {
                "step": f"reasoning_candidate_{i}",
                "Q_value": random.uniform(0.5, 0.9)
            }
            candidates.append(candidate)
        best_candidate = max(candidates, key=lambda node: node["Q_value"])
        print("MCTS reasoning - selected candidate:", best_candidate)
        return best_candidate

    def slm_ppm_refinement(self, reasoning_node: Dict[str, Any]) -> Dict[str, Any]:
        refined = reasoning_node.copy()
        refined["verified"] = True
        refined["Q_value"] += 0.1
        print("SLM to PPM refinement completed:", refined)
        return refined

    def iterative_refinement(self, reasoning_node: Dict[str, Any]) -> Dict[str, Any]:
        refined = reasoning_node.copy()
        refined["Q_value"] += 0.05
        print("Iterative refinement completed:", refined)
        return refined

    def final_selection_and_decay(self, reasoning_node: Dict[str, Any]):
        print("Final selection reached with node:", reasoning_node)
        if self.iteration % 3 == 0 and self.iteration > 0:
            self.latent_model.neuron_decay(self.decay_rate)
            self.dynamic_loss *= 0.94
            print(f"Dynamic Loss updated to: {self.dynamic_loss:.4f}")

    def update_performance(self, reasoning_node: Dict[str, Any]):
        performance = reasoning_node.get("Q_value", 0.0)
        self.dynamic_loss = 1.0 / (performance + 1e-6)
        self.latest_q_value = performance
        self.q_history.append((self.iteration, performance))
        print(f"Dynamic performance (loss) updated: {self.dynamic_loss:.4f}")

    def run_training_iteration(self):
        print(f"\n=== Starting training iteration: {self.iteration} ===")
        self.collect_in_knowledge_data()
        reasoning = self.mcts_guided_reasoning()
        reasoning = self.slm_ppm_refinement(reasoning)
        reasoning = self.iterative_refinement(reasoning)
        self.final_selection_and_decay(reasoning)
        self.update_performance(reasoning)
        self.decay_rate = rl_adaptive_forgetting_speed(
            current_performance=reasoning.get("Q_value", 0.0),
            desired_performance=CONFIG["training"]["desired_performance"],
            current_decay_rate=self.decay_rate
        )
        self.iteration += 1
        print(f"=== Completed training iteration: {self.iteration} ===\n")

# =============================================================================
# GPT Integration
# =============================================================================
def gpt_train_math_and_generate_text(current_stage: str) -> str:
    """
    GPT-based text generation for math training samples.
    """
    prompt = (
        f"You are an expert math tutor. Generate a few examples and explanations for {current_stage} math problems. "
        "Start with a simple arithmetic example such as '2 + 2 = 4' and then gradually increase the complexity."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are an expert math tutor."},
                      {"role": "user", "content": prompt}],
            max_tokens=CONFIG["gpt"]["max_tokens"],
            temperature=CONFIG["gpt"]["temperature"]
        )
        training_text = response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        training_text = f"Error generating training text: {e}"
    return training_text

def gpt_train_math_and_generate_image(current_stage: str) -> str:
    """
    Placeholder for GPT-based image generation.
    Creates a blank image as a stub.
    """
    image_path = os.path.join("generated_images", f"{current_stage}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}.png")
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    blank_image = np.zeros((256, 256, 3), np.uint8)
    cv2.imwrite(image_path, blank_image)
    return image_path

# =============================================================================
# Global Variables
# =============================================================================
RUN_TRAINING = False

# =============================================================================
# UI and Threads
# =============================================================================
def training_thread(engine, max_iterations, update_ui_callback):
    global RUN_TRAINING
    while RUN_TRAINING and engine.iteration < max_iterations:
        engine.run_training_iteration()
        update_ui_callback()
        time.sleep(0.5)
    print("Training thread has finished.")

def start_training(engine, max_iterations, output_text):
    global RUN_TRAINING
    if RUN_TRAINING:
        output_text.insert(tk.END, "Training is already running.\n")
        return
    RUN_TRAINING = True
    output_text.insert(tk.END, "Training started...\n")
    thread = threading.Thread(
        target=training_thread,
        args=(engine, max_iterations, lambda: None),
        daemon=True
    )
    thread.start()

def stop_training(output_text):
    global RUN_TRAINING
    RUN_TRAINING = False
    output_text.insert(tk.END, "Training stopped by user.\n")

def annotate_data(output_text):
    annotation = simpledialog.askstring("Annotate Data", "Enter your annotation:")
    if annotation:
        with open("annotations.txt", "a") as f:
            f.write(f"{annotation}\n")
        output_text.insert(tk.END, f"Annotation saved: {annotation}\n")

def show_evaluation_logs(output_widget):
    """
    Display logs. This function can be extended to read from disk if needed.
    """
    output_widget.config(state='normal')
    output_widget.delete("1.0", tk.END)
    output_widget.insert(tk.END, "Evaluation logs displayed here.\n")
    output_widget.config(state='disabled')

def refresh_evaluation_tab(env: SelfReinforcingEnvironment,
                           latent_space: EnhancedLatentSpace,
                           text_widget: scrolledtext.ScrolledText,
                           label_mental_screen: tk.Label,
                           label_qvalue_plot: tk.Label):
    """
    Updates the evaluation tab with:
      - Latest logs (iteration, Q_value, loss)
      - Updated mental screen image
      - Plot of Q_value history over time
    """
    # Update log text
    text_widget.config(state='normal')
    text_widget.delete("1.0", tk.END)
    msg = f"Iteration: {env.iteration}\nLatest Q_value: {env.latest_q_value:.4f}\nDynamic Loss: {env.dynamic_loss:.4f}"
    text_widget.insert(tk.END, msg + "\n")
    text_widget.config(state='disabled')

    # Update mental screen 2D
    screen_img = latent_space.get_mental_screen_2d_as_image()
    screen_img_tk = ImageTk.PhotoImage(screen_img)
    label_mental_screen.config(image=screen_img_tk)
    label_mental_screen.image = screen_img_tk  # keep a reference

    # Plot Q_value history
    if env.q_history:
        iterations, q_values = zip(*env.q_history)
    else:
        iterations, q_values = [0], [env.latest_q_value]
    fig, ax = plt.subplots(figsize=(3, 2))
    ax.plot(iterations, q_values, marker='o', linestyle='-')
    ax.set_title("Q_value History")
    ax.set_xlabel("Iteration")
    ax.set_ylabel("Q_value")
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    qvalue_img = Image.open(buf)
    qvalue_img_tk = ImageTk.PhotoImage(qvalue_img)
    label_qvalue_plot.config(image=qvalue_img_tk)
    label_qvalue_plot.image = qvalue_img_tk  # keep a reference

# =============================================================================
# Handwriting Annotation Tab (Drawing Canvas for Training Data)
# =============================================================================
class DrawCanvas(tk.Canvas):
    def __init__(self, parent, width=200, height=200, bg='white', **kwargs):
        super().__init__(parent, width=width, height=height, bg=bg, **kwargs)
        self.bind("<B1-Motion>", self.draw)
        self.bind("<ButtonPress-1>", self.start_draw)
        self.bind("<ButtonRelease-1>", self.end_draw)
        # PIL image for saving the drawing
        self.image = Image.new("L", (width, height), "white")
        self.draw_handle = ImageDraw.Draw(self.image)
        self.last_x, self.last_y = None, None

    def start_draw(self, event):
        self.last_x, self.last_y = event.x, event.y

    def draw(self, event):
        if self.last_x is not None and self.last_y is not None:
            self.create_line((self.last_x, self.last_y, event.x, event.y), fill='black', width=8)
            self.draw_handle.line((self.last_x, self.last_y, event.x, event.y), fill='black', width=8)
        self.last_x, self.last_y = event.x, event.y

    def end_draw(self, event):
        self.last_x, self.last_y = None, None

    def clear(self):
        self.delete("all")
        self.image = Image.new("L", (self.winfo_width(), self.winfo_height()), "white")
        self.draw_handle = ImageDraw.Draw(self.image)

    def get_image(self) -> Image.Image:
        return self.image

def save_drawing(canvas: DrawCanvas, output_text: scrolledtext.ScrolledText):
    annotation = simpledialog.askstring("Annotate Drawing", "Enter the label for this drawing (e.g., 1):")
    if annotation is None or annotation.strip() == "":
        output_text.insert(tk.END, "No annotation provided. Drawing not saved.\n")
        return
    # Save drawing image and annotation
    timestamp = datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')
    save_dir = os.path.join("handwriting_data")
    os.makedirs(save_dir, exist_ok=True)
    img_path = os.path.join(save_dir, f"drawing_{timestamp}.png")
    canvas.get_image().save(img_path)
    # Save metadata
    meta_path = os.path.join(save_dir, f"drawing_{timestamp}.json")
    with open(meta_path, "w") as f:
        json.dump({"timestamp": timestamp, "annotation": annotation}, f)
    output_text.insert(tk.END, f"Drawing saved as {img_path} with annotation '{annotation}'\n")
    canvas.clear()

# =============================================================================
# Generate Parameters Tab
# =============================================================================
def generate_parameters_tab(output_text):
    """
    A placeholder function to set generation parameters (GPT, etc.).
    """
    param = simpledialog.askstring("Set Generation Parameter", "Enter new temperature (0.0 - 1.0):")
    if param:
        try:
            val = float(param)
            val = max(0.0, min(1.0, val))
            CONFIG["gpt"]["temperature"] = val
            output_text.insert(tk.END, f"GPT temperature set to {val}\n")
        except ValueError:
            output_text.insert(tk.END, f"Invalid value: {param}\n")

# =============================================================================
# Create UI with Multiple Tabs
# =============================================================================
def create_ui(env: SelfReinforcingEnvironment, max_iterations: int, latent_space: EnhancedLatentSpace):
    root = tk.Tk()
    root.title("Modular AI Training Tool")

    notebook = ttk.Notebook(root)
    notebook.pack(fill='both', expand=True)

    # ------------------
    # Tab 1: Training & Console
    # ------------------
    tab1 = ttk.Frame(notebook)
    notebook.add(tab1, text="Training & Console")

    output_text_tab1 = scrolledtext.ScrolledText(tab1, width=80, height=15)
    output_text_tab1.pack(pady=10)

    start_button = tk.Button(tab1, text="Start Training",
                             command=lambda: start_training(env, max_iterations, output_text_tab1))
    start_button.pack(pady=5)

    stop_button = tk.Button(tab1, text="Stop Training",
                            command=lambda: stop_training(output_text_tab1))
    stop_button.pack(pady=5)

    # ------------------
    # Tab 2: Handwriting Annotation (Drawing Canvas for Training Data)
    # ------------------
    tab2 = ttk.Frame(notebook)
    notebook.add(tab2, text="Handwriting Annotation")

    instructions = tk.Label(tab2, text="Draw a digit (or any symbol) below, then click 'Save Drawing' with an annotation.")
    instructions.pack(pady=5)
    draw_canvas = DrawCanvas(tab2, width=200, height=200)
    draw_canvas.pack(pady=5)
    output_text_tab2 = scrolledtext.ScrolledText(tab2, width=80, height=10)
    output_text_tab2.pack(pady=5)
    save_button = tk.Button(tab2, text="Save Drawing",
                            command=lambda: save_drawing(draw_canvas, output_text_tab2))
    save_button.pack(pady=5)

    # ------------------
    # Tab 3: Evaluation
    # ------------------
    tab3 = ttk.Frame(notebook)
    notebook.add(tab3, text="Evaluation")

    eval_text = scrolledtext.ScrolledText(tab3, width=60, height=5)
    eval_text.config(state='disabled')
    eval_text.pack(pady=5)

    label_mental_screen = tk.Label(tab3, text="Mental Screen 2D")
    label_mental_screen.pack(pady=5)

    label_qvalue_plot = tk.Label(tab3, text="Q_value History")
    label_qvalue_plot.pack(pady=5)

    refresh_button = tk.Button(tab3, text="Refresh Evaluation",
                                command=lambda: refresh_evaluation_tab(env, latent_space, eval_text,
                                                                       label_mental_screen, label_qvalue_plot))
    refresh_button.pack(pady=5)

    # ------------------
    # Tab 4: Generate (GPT settings and generation)
    # ------------------
    tab4 = ttk.Frame(notebook)
    notebook.add(tab4, text="Generate")

    output_text_tab4 = scrolledtext.ScrolledText(tab4, width=80, height=15)
    output_text_tab4.pack(pady=10)

    gen_param_button = tk.Button(tab4, text="Set GPT Temperature",
                                 command=lambda: generate_parameters_tab(output_text_tab4))
    gen_param_button.pack(pady=5)

    def generate_gpt_text():
        stage = CONFIG["gpt"]["basic_stage"]
        txt = gpt_train_math_and_generate_text(stage)
        output_text_tab4.insert(tk.END, f"Generated text:\n{txt}\n\n")
    gen_text_button = tk.Button(tab4, text="Generate GPT Text", command=generate_gpt_text)
    gen_text_button.pack(pady=5)

    def generate_gpt_img():
        stage = CONFIG["gpt"]["basic_stage"]
        img_path = gpt_train_math_and_generate_image(stage)
        output_text_tab4.insert(tk.END, f"Generated image at: {img_path}\n\n")
    gen_img_button = tk.Button(tab4, text="Generate GPT Image", command=generate_gpt_img)
    gen_img_button.pack(pady=5)

    # ------------------
    # Additional future tabs could be added here (e.g., dataset explorer, layer editor, etc.)
    # ------------------

    def on_closing():
        stop_training(output_text_tab1)
        root.destroy()
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

# =============================================================================
# Main
# =============================================================================
def main():
    print("=== Modular AI Training Tool ===")
    print("1) Real-time evaluation with Q_value history and live mental screen updates.")
    print("2) Handwriting Annotation tab for generating training data by drawing.")
    print("3) GPT integration with adjustable generation parameters.")
    print("4) Modular design for future extensions (e.g., dataset integration, layer editor).\n")

    latent_config = CONFIG["latent_space"]
    latent_space = EnhancedLatentSpace(latent_config)

    env = SelfReinforcingEnvironment(latent_model=latent_space,
                                     decay_rate=CONFIG["training"]["initial_decay_rate"])

    # Create UI with all tabs
    create_ui(env, CONFIG["training"]["max_iterations"], latent_space)

if __name__ == "__main__":
    main()
