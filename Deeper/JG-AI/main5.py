#!/usr/bin/env python3
"""
Modular AI Training Tool v3.2
-----------------------------
This version organizes the UI into three main tabs:

1. Training  
   Contains three Level 2 tabs:
     - Settings (for training parameters)
     - Model Editor (to view the current model architecture)
     - Console (to see live training logs)

2. Dataset & Teaching  
   Contains two Level 2 tabs:
     - Select Dataset (shows locally available datasets – including already made handwritten files)
     - Handwritten Data (for drawing, annotation, and training on handwritten data)

3. Testing  
   Contains two Level 2 tabs:
     - Evaluation Metrics (with sub-tabs for separate metrics; currently showing Q_value history and mental screen)
     - Testing (includes a “Trigger Inference” button)

This version uses the default white UI.

Requirements:
  - Python 3.8+ with required libraries.
  - .env file with OPENAI_API_KEY.
"""

import os
import json
import datetime
import random
import time
import io
from typing import Dict, Any
import threading

import torch
import torch.nn as nn
import matplotlib
matplotlib.use("Agg")
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
# Global Configuration Dictionary
# =============================================================================
CONFIG = {
    "latent_space": {
        "height": 16,
        "width": 16,
        "channels": 3,
        "time_dim": 1,
        "embed_dim": 128,
        "num_detection_classes": 10,
        "mental_screen_2d_height": 64,
        "mental_screen_2d_width": 64,
    },
    "training": {
        "initial_decay_rate": 0.01,
        "desired_performance": 0.9,
        "max_iterations": 10,  # Shown for settings; training will not be halted automatically after this limit.
        "learning_rate": 0.001,
        "rstar_setting": {
            "enable": True,
            "param1": 0.5,
            "param2": 0.8
        }
    },
    "gpt": {
        "basic_stage": "basic_arithmetic",
        "advanced_stage": "advanced_algebra",
        "max_tokens": 150,
        "temperature": 0.7,
    }
}

# =============================================================================
# Enhanced Latent Space (Model Definition)
# =============================================================================
class EnhancedLatentSpace(nn.Module):
    def __init__(self, config: Dict[str, Any]):
        super(EnhancedLatentSpace, self).__init__()
        self.height = config["height"]
        self.width = config["width"]
        self.channels = config["channels"]
        self.embed_dim = config["embed_dim"]
        self.time_dim = config["time_dim"]
        self.flatten_dim = self.height * self.width * self.channels

        ms_h = config.get("mental_screen_2d_height", 64)
        ms_w = config.get("mental_screen_2d_width", 64)
        self.mental_screen_2d = nn.Parameter(torch.randn(ms_h, ms_w))

        self.spatial_2d_embedding = nn.Parameter(torch.randn(self.height, self.width, self.embed_dim))
        self.spatial_3d_embedding = None
        self.spatial_4d_embedding = None

        self.time_embedding = nn.Parameter(torch.randn(self.time_dim, self.embed_dim))
        self.latent_embedding = nn.Linear(self.flatten_dim, self.embed_dim)

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
        spatial_2d = self.spatial_2d_embedding.view(-1, self.embed_dim).unsqueeze(0).repeat(batch_size, 1, 1)
        spatial_mean = spatial_2d.mean(dim=1)
        if time_index >= self.time_dim:
            raise ValueError(f"time_index ({time_index}) out of range (max {self.time_dim})")
        time_embed = self.time_embedding[time_index].unsqueeze(0).repeat(batch_size, 1)
        if self.use_cnn:
            x_cnn = self.cnn_head(x)
            combined = torch.cat((x_cnn, latent_embed, spatial_mean, time_embed), dim=1)
        else:
            combined = torch.cat((latent_embed, spatial_mean, time_embed), dim=1)
        detection_logits = self.yolo_head(combined)
        return detection_logits

    def get_mental_screen_2d_as_image(self) -> Image.Image:
        with torch.no_grad():
            screen_data = self.mental_screen_2d.clone().cpu().numpy()
            screen_data = (screen_data - screen_data.min()) / (screen_data.max() - screen_data.min() + 1e-9)
            screen_data *= 255.0
            screen_data = screen_data.astype(np.uint8)
            pil_img = Image.fromarray(screen_data, mode='L')
        return pil_img

    def neuron_decay(self, decay_rate: float):
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
def rl_adaptive_forgetting_speed(current_performance: float, desired_performance: float, current_decay_rate: float) -> float:
    if current_performance < desired_performance:
        new_decay_rate = max(current_decay_rate * 0.9, 0.001)
    else:
        new_decay_rate = min(current_decay_rate * 1.1, 0.1)
    print(f"Decay rate adapted from {current_decay_rate:.4f} to {new_decay_rate:.4f}")
    return new_decay_rate

# =============================================================================
# Self-Reinforcing Environment
# =============================================================================
class SelfReinforcingEnvironment:
    def __init__(self, latent_model: EnhancedLatentSpace, decay_rate: float):
        self.latent_model = latent_model
        self.decay_rate = decay_rate
        self.iteration = 0
        self.dynamic_loss = 1.0
        self.latest_q_value = 0.0
        self.q_history = []

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
        print(f"Knowledge data saved at: {data_path}")
        return data_path

    def mcts_guided_reasoning(self) -> Dict[str, Any]:
        candidates = []
        for i in range(5):
            candidate = {"step": f"candidate_{i}", "Q_value": random.uniform(0.5, 0.9)}
            candidates.append(candidate)
        best_candidate = max(candidates, key=lambda n: n["Q_value"])
        print("MCTS reasoning selected:", best_candidate)
        return best_candidate

    def slm_ppm_refinement(self, reasoning_node: Dict[str, Any]) -> Dict[str, Any]:
        refined = reasoning_node.copy()
        refined["verified"] = True
        refined["Q_value"] += 0.1
        print("SLM refinement:", refined)
        return refined

    def iterative_refinement(self, reasoning_node: Dict[str, Any]) -> Dict[str, Any]:
        refined = reasoning_node.copy()
        refined["Q_value"] += 0.05
        print("Iterative refinement:", refined)
        return refined

    def final_selection_and_decay(self, reasoning_node: Dict[str, Any]):
        print("Final reasoning:", reasoning_node)
        if self.iteration % 3 == 0 and self.iteration > 0:
            self.latent_model.neuron_decay(self.decay_rate)
            self.dynamic_loss *= 0.94
            print(f"Dynamic loss updated to: {self.dynamic_loss:.4f}")

    def update_performance(self, reasoning_node: Dict[str, Any]):
        performance = reasoning_node.get("Q_value", 0.0)
        self.dynamic_loss = 1.0 / (performance + 1e-6)
        self.latest_q_value = performance
        self.q_history.append((self.iteration, performance))
        print(f"Updated performance, loss: {self.dynamic_loss:.4f}")

    def run_training_iteration(self):
        print(f"\n=== Running training iteration: {self.iteration} ===")
        self.collect_in_knowledge_data()
        reasoning = self.mcts_guided_reasoning()
        reasoning = self.slm_ppm_refinement(reasoning)
        reasoning = self.iterative_refinement(reasoning)
        self.final_selection_and_decay(reasoning)
        self.update_performance(reasoning)
        self.decay_rate = rl_adaptive_forgetting_speed(
            reasoning.get("Q_value", 0.0),
            CONFIG["training"]["desired_performance"],
            self.decay_rate
        )
        self.iteration += 1
        print(f"=== Completed iteration: {self.iteration} ===\n")

# =============================================================================
# GPT Integration (Placeholders)
# =============================================================================
def gpt_train_math_and_generate_text(current_stage: str) -> str:
    prompt = (
        f"You are an expert math tutor. Generate a few examples for {current_stage} math problems. "
        "Start with a simple arithmetic example and gradually increase complexity."
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
        text = response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        text = f"Error with GPT text generation: {e}"
    return text

def gpt_train_math_and_generate_image(current_stage: str) -> str:
    image_path = os.path.join("generated_images", f"{current_stage}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}.png")
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    blank_image = np.zeros((256, 256, 3), np.uint8)
    cv2.imwrite(image_path, blank_image)
    return image_path

# =============================================================================
# Global Training Flag
# =============================================================================
RUN_TRAINING = False

# =============================================================================
# UI & Threads (Using the default white background)
# =============================================================================
def training_thread(engine, update_ui_callback):
    global RUN_TRAINING
    while RUN_TRAINING:
        engine.run_training_iteration()
        update_ui_callback()
        time.sleep(0.5)
    print("Training thread completed.")

def start_training(engine, output_text):
    global RUN_TRAINING
    if RUN_TRAINING:
        output_text.insert(tk.END, "Training already running.\n")
        return
    RUN_TRAINING = True
    output_text.insert(tk.END, "Training started...\n")
    thread = threading.Thread(target=training_thread, args=(engine, lambda: None), daemon=True)
    thread.start()

def stop_training(output_text):
    global RUN_TRAINING
    RUN_TRAINING = False
    output_text.insert(tk.END, "Training stopped.\n")

# =============================================================================
# Teaching: Drawing Canvas for Handwritten Data
# =============================================================================
class DrawCanvas(tk.Canvas):
    def __init__(self, parent, width=200, height=200, bg='white', **kwargs):
        super().__init__(parent, width=width, height=height, bg=bg, **kwargs)
        self.bind("<B1-Motion>", self.draw)
        self.bind("<ButtonPress-1>", self.start_draw)
        self.bind("<ButtonRelease-1>", self.end_draw)
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
    annotation = simpledialog.askstring("Annotate Drawing", "Enter the label (e.g., 1):")
    if not annotation:
        output_text.insert(tk.END, "No annotation provided. Drawing not saved.\n")
        return
    timestamp = datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')
    save_dir = os.path.join("handwriting_data")
    os.makedirs(save_dir, exist_ok=True)
    img_path = os.path.join(save_dir, f"drawing_{timestamp}.png")
    canvas.get_image().save(img_path)
    meta_path = os.path.join(save_dir, f"drawing_{timestamp}.json")
    with open(meta_path, "w") as f:
        json.dump({"timestamp": timestamp, "annotation": annotation}, f)
    output_text.insert(tk.END, f"Drawing saved: {img_path} with label '{annotation}'\n")
    canvas.clear()

def train_on_drawing(output_text: scrolledtext.ScrolledText):
    output_text.insert(tk.END, "Training on the handwritten data (placeholder).\n")

# =============================================================================
# Dataset Functions
# =============================================================================
def list_local_handwritten_datasets() -> str:
    """Return a string with the list of saved handwritten images."""
    save_dir = "handwriting_data"
    if not os.path.exists(save_dir):
        return "No handwritten data available."
    files = os.listdir(save_dir)
    # Filter PNG files
    images = [f for f in files if f.lower().endswith(".png")]
    if images:
        return "\n".join(images)
    else:
        return "No handwritten data available."

# =============================================================================
# Testing Functions
# =============================================================================
def trigger_inference(output_text: scrolledtext.ScrolledText):
    output_text.insert(tk.END, "Inference triggered (placeholder).\n")

def run_tests(output_text: scrolledtext.ScrolledText):
    output_text.insert(tk.END, "Tests executed (placeholder).\n")

# =============================================================================
# Evaluation & Metrics Functions
# =============================================================================
def refresh_evaluation_tab(env: SelfReinforcingEnvironment, latent_space: EnhancedLatentSpace,
                           eval_console: scrolledtext.ScrolledText, mental_screen_label: tk.Label,
                           metric_plot_label: tk.Label):
    eval_console.config(state='normal')
    eval_console.delete("1.0", tk.END)
    msg = f"Iteration: {env.iteration}\nLatest Q_value: {env.latest_q_value:.4f}\nDynamic Loss: {env.dynamic_loss:.4f}"
    eval_console.insert(tk.END, msg + "\n")
    eval_console.config(state='disabled')

    screen_img = latent_space.get_mental_screen_2d_as_image()
    screen_img_tk = ImageTk.PhotoImage(screen_img)
    mental_screen_label.config(image=screen_img_tk)
    mental_screen_label.image = screen_img_tk

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
    metric_img = Image.open(buf)
    metric_img_tk = ImageTk.PhotoImage(metric_img)
    metric_plot_label.config(image=metric_img_tk)
    metric_plot_label.image = metric_img_tk

# =============================================================================
# Create Hierarchical UI with Three Main Tabs (White Theme)
# =============================================================================
def create_ui(env: SelfReinforcingEnvironment, latent_space: EnhancedLatentSpace):
    root = tk.Tk()
    root.title("Modular AI Training Tool v3.2")

    main_notebook = ttk.Notebook(root)
    main_notebook.pack(fill='both', expand=True)

    # ------------------
    # Main Tab 1: Training
    # ------------------
    tab_training = ttk.Frame(main_notebook)
    main_notebook.add(tab_training, text="Training")

    # Level 2 Tabs for Training: Settings, Model Editor, and Console.
    train_notebook = ttk.Notebook(tab_training)
    train_notebook.pack(fill='both', expand=True)

    # Sub-tab: Settings
    tab_train_settings = ttk.Frame(train_notebook)
    train_notebook.add(tab_train_settings, text="Settings")
    settings_frame = ttk.LabelFrame(tab_train_settings, text="Training Settings")
    settings_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
    basic_frame = ttk.LabelFrame(settings_frame, text="Basic Settings")
    basic_frame.pack(fill=tk.X, padx=5, pady=5)
    tk.Label(basic_frame, text="Learning Rate:").grid(row=0, column=0, sticky="w", padx=2, pady=2)
    lr_entry = tk.Entry(basic_frame)
    lr_entry.insert(0, str(CONFIG["training"]["learning_rate"]))
    lr_entry.grid(row=0, column=1, padx=2, pady=2)
    tk.Label(basic_frame, text="Max Iterations:").grid(row=1, column=0, sticky="w", padx=2, pady=2)
    iter_entry = tk.Entry(basic_frame)
    iter_entry.insert(0, str(CONFIG["training"]["max_iterations"]))
    iter_entry.grid(row=1, column=1, padx=2, pady=2)
    rstar_frame = ttk.LabelFrame(settings_frame, text="rStar Settings")
    rstar_frame.pack(fill=tk.X, padx=5, pady=5)
    tk.Label(rstar_frame, text="Enable rStar:").grid(row=0, column=0, sticky="w", padx=2, pady=2)
    rstar_enabled = tk.BooleanVar(value=CONFIG["training"]["rstar_setting"]["enable"])
    tk.Checkbutton(rstar_frame, variable=rstar_enabled).grid(row=0, column=1, padx=2, pady=2)
    tk.Label(rstar_frame, text="Parameter 1:").grid(row=1, column=0, sticky="w", padx=2, pady=2)
    rstar_param1 = tk.Entry(rstar_frame)
    rstar_param1.insert(0, str(CONFIG["training"]["rstar_setting"]["param1"]))
    rstar_param1.grid(row=1, column=1, padx=2, pady=2)
    def update_training_settings():
        try:
            CONFIG["training"]["learning_rate"] = float(lr_entry.get())
            CONFIG["training"]["max_iterations"] = int(iter_entry.get())
            CONFIG["training"]["rstar_setting"]["enable"] = rstar_enabled.get()
            CONFIG["training"]["rstar_setting"]["param1"] = float(rstar_param1.get())
            messagebox.showinfo("Settings", "Training settings updated.")
        except Exception as e:
            messagebox.showerror("Error", f"Error updating settings: {e}")
    tk.Button(settings_frame, text="Update Settings", command=update_training_settings).pack(pady=5)

    # Sub-tab: Model Editor (shows a textual representation)
    tab_model_editor = ttk.Frame(train_notebook)
    train_notebook.add(tab_model_editor, text="Model Editor")
    editor_frame = ttk.LabelFrame(tab_model_editor, text="Model Editor")
    editor_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
    model_editor_console = scrolledtext.ScrolledText(editor_frame, width=40, height=10)
    model_editor_console.pack(padx=5, pady=5)
    tk.Button(editor_frame, text="Refresh Model Editor",
              command=lambda: show_model_editor(latent_space, model_editor_console)).pack(pady=5)

    # Sub-tab: Console (live training logs)
    tab_train_console = ttk.Frame(train_notebook)
    train_notebook.add(tab_train_console, text="Console")
    console_frame = ttk.LabelFrame(tab_train_console, text="Training Console")
    console_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
    train_console = scrolledtext.ScrolledText(console_frame, width=50, height=20)
    train_console.pack(padx=5, pady=5)
    tk.Button(console_frame, text="Start Training", command=lambda: start_training(env, train_console)).pack(pady=2)
    tk.Button(console_frame, text="Stop Training", command=lambda: stop_training(train_console)).pack(pady=2)

    # ------------------
    # Main Tab 2: Dataset & Teaching
    # ------------------
    tab_dataset_teaching = ttk.Frame(main_notebook)
    main_notebook.add(tab_dataset_teaching, text="Dataset & Teaching")
    dt_notebook = ttk.Notebook(tab_dataset_teaching)
    dt_notebook.pack(fill='both', expand=True)

    # Sub-tab: Select Dataset
    tab_select_dataset = ttk.Frame(dt_notebook)
    dt_notebook.add(tab_select_dataset, text="Select Dataset")
    dataset_frame = ttk.LabelFrame(tab_select_dataset, text="Available Datasets")
    dataset_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
    dataset_console = scrolledtext.ScrolledText(dataset_frame, width=60, height=20)
    dataset_console.pack(padx=5, pady=5)
    def refresh_dataset_list():
        local_data = list_local_handwritten_datasets()
        dataset_console.delete("1.0", tk.END)
        dataset_console.insert(tk.END, "Local Handwritten Files:\n")
        dataset_console.insert(tk.END, local_data)
    tk.Button(dataset_frame, text="Refresh Dataset List", command=refresh_dataset_list).pack(pady=5)

    # Sub-tab: Handwritten Data (for drawing new data)
    tab_handwritten_data = ttk.Frame(dt_notebook)
    dt_notebook.add(tab_handwritten_data, text="Handwritten Data")
    tk.Label(tab_handwritten_data, text="Draw a digit/symbol, annotate it, and optionally train on it.").pack(pady=5)
    draw_canvas = DrawCanvas(tab_handwritten_data, width=200, height=200, bg="white")
    draw_canvas.pack(pady=5)
    dt_console2 = scrolledtext.ScrolledText(tab_handwritten_data, width=60, height=10)
    dt_console2.pack(pady=5)
    btn_frame_dt = tk.Frame(tab_handwritten_data)
    btn_frame_dt.pack(pady=5)
    tk.Button(btn_frame_dt, text="Save Drawing", command=lambda: save_drawing(draw_canvas, dt_console2)).grid(row=0, column=0, padx=5)
    tk.Button(btn_frame_dt, text="Train on Drawing", command=lambda: train_on_drawing(dt_console2)).grid(row=0, column=1, padx=5)

    # ------------------
    # Main Tab 3: Testing
    # ------------------
    tab_testing = ttk.Frame(main_notebook)
    main_notebook.add(tab_testing, text="Testing")
    test_notebook = ttk.Notebook(tab_testing)
    test_notebook.pack(fill='both', expand=True)

    # Sub-tab: Evaluation Metrics (can be expanded with more metrics)
    tab_eval_metrics = ttk.Frame(test_notebook)
    test_notebook.add(tab_eval_metrics, text="Evaluation Metrics")
    eval_frame = ttk.LabelFrame(tab_eval_metrics, text="Evaluation Metrics")
    eval_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
    eval_console = scrolledtext.ScrolledText(eval_frame, width=60, height=8)
    eval_console.pack(pady=5)
    mental_screen_label = tk.Label(eval_frame, text="Mental Screen 2D")
    mental_screen_label.pack(pady=5)
    metric_plot_label = tk.Label(eval_frame, text="Metric Plot")
    metric_plot_label.pack(pady=5)
    tk.Button(eval_frame, text="Refresh Evaluation",
              command=lambda: refresh_evaluation_tab(env, latent_space, eval_console, mental_screen_label, metric_plot_label)).pack(pady=5)

    # Sub-tab: Testing (including Trigger Inference)
    tab_testing_ctrl = ttk.Frame(test_notebook)
    test_notebook.add(tab_testing_ctrl, text="Testing")
    test_frame = ttk.LabelFrame(tab_testing_ctrl, text="Testing Console")
    test_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
    test_console = scrolledtext.ScrolledText(test_frame, width=60, height=20)
    test_console.pack(pady=5)
    tk.Button(test_frame, text="Trigger Inference", command=lambda: trigger_inference(test_console)).pack(pady=5)
    tk.Button(test_frame, text="Run Tests", command=lambda: run_tests(test_console)).pack(pady=5)

    def on_closing():
        stop_training(train_console)
        root.destroy()
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

# =============================================================================
# Main
# =============================================================================
def main():
    print("=== Modular AI Training Tool v3.2 ===")
    print("Main Tabs: Training | Dataset & Teaching | Testing")
    latent_config = CONFIG["latent_space"]
    latent_space = EnhancedLatentSpace(latent_config)
    env = SelfReinforcingEnvironment(latent_model=latent_space,
                                     decay_rate=CONFIG["training"]["initial_decay_rate"])
    create_ui(env, latent_space)

if __name__ == "__main__":
    main()
