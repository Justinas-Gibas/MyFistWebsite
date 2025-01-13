#!/usr/bin/env python3
"""
Newer Expanded & Improved Version (Imaginary PhD):
 - Self-Reinforcing Hybrid Model Framework with:
    1) rStar-Math Self-Evolution
    2) Extended Multi-Dimensional Mental Screen (2D, placeholders for 3D & 4D)
    3) Non-blocking visualization integrated into the Evaluation tab
    4) Start/Stop training only after UI button clicks
    5) Additional 'Generate' tab for GPT/parameter settings
    6) Enhanced console logging in UI
    7) Placeholders for advanced expansions

Requirements:
  - Python 3.8+
  - Libraries: torch, torchvision, torchaudio, matplotlib, python-dotenv,
    openai, opencv-python-headless, numpy, Pillow (for Tk display),
    tkinter/ttk (standard in many Python installs).
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
from tkinter import ttk, scrolledtext, simpledialog
from PIL import Image, ImageTk


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
    for 3D and 4D expansions. It includes:
      - A 2D mental screen matrix
      - A separate trainable 2D embedding for the usual (height, width) from the config
      - Time embedding
      - Optional YOLO-like head or CNN-based detection head
      - Neuron decay for forgetting

    The mental_screen_2d acts as a conceptual area for the LLM or
    downstream reasoner to interpret pixel/point data.
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
        # Placeholders for 3D, 4D (not used, but to keep structure open)
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

        # Combine
        if self.use_cnn:
            # Placeholder if we had a CNN
            x_cnn = self.cnn_head(x)
            combined = torch.cat((x_cnn, latent_embed, spatial_mean, time_embed), dim=1)
        else:
            combined = torch.cat((latent_embed, spatial_mean, time_embed), dim=1)

        # YOLO-like
        detection_logits = self.yolo_head(combined)
        return detection_logits

    def get_mental_screen_2d_as_image(self) -> Image.Image:
        """
        Convert the mental_screen_2d to a PIL Image for UI display in the evaluation tab.
        We normalize to [0,255] for visualization.
        """
        with torch.no_grad():
            screen_data = self.mental_screen_2d.clone().cpu().numpy()
            screen_data = (screen_data - screen_data.min()) / (screen_data.max() - screen_data.min() + 1e-9)
            screen_data *= 255.0
            screen_data = screen_data.astype(np.uint8)
            pil_img = Image.fromarray(screen_data, mode='L')  # grayscale
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
    rStar-Math self-evolution with 5 stages, updating dynamic performance metric.
    Also logs data for later evaluation.
    """
    def __init__(self, latent_model: EnhancedLatentSpace, decay_rate: float):
        self.latent_model = latent_model
        self.decay_rate = decay_rate
        self.iteration = 0
        self.dynamic_loss = 1.0
        self.latest_q_value = 0.0  # track for UI display

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
            messages=[
                {"role": "system", "content": "You are an expert math tutor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=CONFIG["gpt"]["max_tokens"],
            temperature=CONFIG["gpt"]["temperature"]
        )
        training_text = response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        training_text = f"Error generating training text: {e}"
    return training_text

def gpt_train_math_and_generate_image(current_stage: str) -> str:
    """
    Placeholder for GPT-based image generation or other model.
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
    Instead of blocking plots, we'll display the mental screen and
    a dynamic Q_value figure on the evaluation tab.
    """
    output_widget.config(state='normal')
    output_widget.delete("1.0", tk.END)
    # Insert logs from environment or disk if you prefer
    # We'll just say logs are in environment's iteration & Q_value
    output_widget.insert(tk.END, "Evaluation logs displayed here.\n")
    output_widget.config(state='disabled')


def refresh_evaluation_tab(env: SelfReinforcingEnvironment,
                           latent_space: EnhancedLatentSpace,
                           text_widget: scrolledtext.ScrolledText,
                           label_mental_screen: tk.Label,
                           label_qvalue_plot: tk.Label):
    """
    Updates the evaluation tab with the latest mental screen image and
    a Q_value figure. Avoid blocking by saving the figure to a buffer.
    """
    # Update text logs
    text_widget.config(state='normal')
    text_widget.delete("1.0", tk.END)
    msg = f"Iteration: {env.iteration}, Latest Q_value: {env.latest_q_value:.4f}, Dynamic Loss: {env.dynamic_loss:.4f}"
    text_widget.insert(tk.END, msg + "\n")
    text_widget.config(state='disabled')

    # Mental Screen 2D
    screen_img = latent_space.get_mental_screen_2d_as_image()
    screen_img_tk = ImageTk.PhotoImage(screen_img)
    label_mental_screen.config(image=screen_img_tk)
    label_mental_screen.image = screen_img_tk  # keep reference

    # Q_value figure
    fig, ax = plt.subplots(figsize=(3, 2))
    ax.plot(env.iteration, env.latest_q_value, 'bo')
    ax.set_title("Q_value Visualization")
    ax.set_xlabel("Iteration")
    ax.set_ylabel("Q_value")
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    qvalue_img = Image.open(buf)
    qvalue_img_tk = ImageTk.PhotoImage(qvalue_img)
    label_qvalue_plot.config(image=qvalue_img_tk)
    label_qvalue_plot.image = qvalue_img_tk  # keep reference


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
# Create UI with 4 tabs:
#   1) Training & Console
#   2) Annotations
#   3) Evaluation
#   4) Generate (GPT param settings, etc.)
# =============================================================================
def create_ui(env: SelfReinforcingEnvironment, max_iterations: int):
    root = tk.Tk()
    root.title("Imaginary PhD: Self-Reinforcing Training UI")

    # Notebook for tabs
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
    # Tab 2: Annotation Tools
    # ------------------
    tab2 = ttk.Frame(notebook)
    notebook.add(tab2, text="Annotations")

    output_text_tab2 = scrolledtext.ScrolledText(tab2, width=80, height=15)
    output_text_tab2.pack(pady=10)

    annotate_button = tk.Button(tab2, text="Annotate Data",
        command=lambda: annotate_data(output_text_tab2))
    annotate_button.pack(pady=5)

    # ------------------
    # Tab 3: Evaluation
    # ------------------
    tab3 = ttk.Frame(notebook)
    notebook.add(tab3, text="Evaluation")

    # We have a text area for logs
    eval_text = scrolledtext.ScrolledText(tab3, width=60, height=5)
    eval_text.config(state='disabled')
    eval_text.pack(pady=5)

    # Show mental screen
    label_mental_screen = tk.Label(tab3, text="Mental Screen 2D")
    label_mental_screen.pack(pady=5)

    # Show Q_value figure
    label_qvalue_plot = tk.Label(tab3, text="Q_value Plot")
    label_qvalue_plot.pack(pady=5)

    # Button to refresh evaluation
    refresh_button = tk.Button(tab3, text="Refresh Evaluation",
        command=lambda: refresh_evaluation_tab(env, env.latent_model, eval_text,
                                               label_mental_screen, label_qvalue_plot))
    refresh_button.pack(pady=5)

    # ------------------
    # Tab 4: Generate (GPT parameters, etc.)
    # ------------------
    tab4 = ttk.Frame(notebook)
    notebook.add(tab4, text="Generate")

    output_text_tab4 = scrolledtext.ScrolledText(tab4, width=80, height=15)
    output_text_tab4.pack(pady=10)

    # Example button to set GPT temperature
    gen_param_button = tk.Button(tab4, text="Set GPT Temperature",
        command=lambda: generate_parameters_tab(output_text_tab4))
    gen_param_button.pack(pady=5)

    # Example button to generate text
    def generate_gpt_text():
        stage = CONFIG["gpt"]["basic_stage"]
        txt = gpt_train_math_and_generate_text(stage)
        output_text_tab4.insert(tk.END, f"Generated text:\n{txt}\n\n")

    gen_text_button = tk.Button(tab4, text="Generate GPT Text", command=generate_gpt_text)
    gen_text_button.pack(pady=5)

    # Example button to generate image
    def generate_gpt_img():
        stage = CONFIG["gpt"]["basic_stage"]
        img_path = gpt_train_math_and_generate_image(stage)
        output_text_tab4.insert(tk.END, f"Generated image at: {img_path}\n\n")

    gen_img_button = tk.Button(tab4, text="Generate GPT Image", command=generate_gpt_img)
    gen_img_button.pack(pady=5)

    # On close
    def on_closing():
        stop_training(output_text_tab1)
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()


# =============================================================================
# Main
# =============================================================================
def main():
    # Print some info
    print("=== Expanded & Improved Imaginary PhD Code ===")
    print("1) Non-blocking visualization integrated into the Evaluation tab.")
    print("2) 2D mental screen with placeholders for 3D and 4D.")
    print("3) Start/Stop training only after UI button clicks.")
    print("4) Additional 'Generate' tab for GPT parameter settings.\n")

    # Initialize model
    latent_config = CONFIG["latent_space"]
    latent_space = EnhancedLatentSpace(latent_config)

    # Initialize environment
    env = SelfReinforcingEnvironment(latent_model=latent_space,
                                     decay_rate=CONFIG["training"]["initial_decay_rate"])

    # Create UI (the user can start training from the UI)
    create_ui(env, CONFIG["training"]["max_iterations"])


if __name__ == "__main__":
    main()
