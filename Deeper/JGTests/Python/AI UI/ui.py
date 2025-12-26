#!/usr/bin/env python3
"""
ui.py

Imaginary PhD:
 - Tkinter UI for the Self-Reinforcing Hybrid Model
 - Organized into multiple tabs:
   1) Training & Console
   2) Annotations
   3) Evaluation
   4) Generate (GPT Param Settings)

This file depends on 'main.py' for:
 - The environment (SelfReinforcingEnvironment)
 - The EnhancedLatentSpace class instance
 - GPT generation functions, etc.

Users can start/stop training, annotate data, visualize mental-screen & Q_value,
and adjust GPT parameters from the UI.
"""

import time
import io
import tkinter as tk
from tkinter import ttk, scrolledtext, simpledialog
from PIL import Image, ImageTk
import matplotlib
matplotlib.use("Agg")  # Use non-blocking backend
import matplotlib.pyplot as plt

# We only import what we need from main to avoid large cyc imports
from main import (
    gpt_train_math_and_generate_text,
    gpt_train_math_and_generate_image,
    CONFIG
)

RUN_TRAINING = False

def training_thread(engine, max_iterations, update_ui_callback):
    """
    Background thread that runs the training iterations. 
    Calls 'engine.run_training_iteration()' until:
      - RUN_TRAINING becomes False
      - or we exceed max_iterations
    After each iteration, it calls 'update_ui_callback()' to refresh.
    """
    global RUN_TRAINING
    while RUN_TRAINING and engine.iteration < max_iterations:
        engine.run_training_iteration()
        update_ui_callback()
        time.sleep(0.5)
    print("Training thread has finished.")

def start_training(engine, max_iterations, output_text):
    """
    Called when user clicks the 'Start Training' button.
    """
    global RUN_TRAINING
    if RUN_TRAINING:
        output_text.insert(tk.END, "Training is already running.\n")
        return
    RUN_TRAINING = True
    output_text.insert(tk.END, "Training started...\n")
    import threading
    thread = threading.Thread(
        target=training_thread,
        args=(engine, max_iterations, lambda: None),
        daemon=True
    )
    thread.start()

def stop_training(output_text):
    """
    Called when user clicks the 'Stop Training' button.
    """
    global RUN_TRAINING
    RUN_TRAINING = False
    output_text.insert(tk.END, "Training stopped by user.\n")

def annotate_data(output_text):
    """
    Simple dialog for data annotation. Saves to 'annotations.txt'.
    """
    annotation = simpledialog.askstring("Annotate Data", "Enter your annotation:")
    if annotation:
        with open("annotations.txt", "a") as f:
            f.write(f"{annotation}\n")
        output_text.insert(tk.END, f"Annotation saved: {annotation}\n")

def generate_parameters_tab(output_text):
    """
    Allows user to set GPT-related parameters dynamically in the UI.
    Example: setting GPT temperature.
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

def refresh_evaluation_tab(env, latent_space, text_widget, label_mental_screen, label_qvalue_plot):
    """
    Updates the evaluation tab with the latest mental screen (2D)
    and a simple Q_value figure. This is done by saving the figure
    to an in-memory buffer, then updating the Tk Label image.
    """
    # 1) Update textual logs
    text_widget.config(state='normal')
    text_widget.delete("1.0", tk.END)
    msg = f"Iteration: {env.iteration}, Latest Q_value: {env.latest_q_value:.4f}, Dynamic Loss: {env.dynamic_loss:.4f}"
    text_widget.insert(tk.END, msg + "\n")
    text_widget.config(state='disabled')

    # 2) Mental Screen 2D -> convert to ImageTk
    screen_data = latent_space.get_mental_screen_2d_as_numpy()  # shape: (ms_h, ms_w)
    # Normalize to [0, 255] for display
    scr_min, scr_max = screen_data.min(), screen_data.max()
    if (scr_max - scr_min) < 1e-9:
        # Avoid division by zero if everything is the same
        scr_max = scr_min + 1e-9
    screen_data = (screen_data - scr_min) / (scr_max - scr_min)
    screen_data *= 255.0
    screen_data = screen_data.astype("uint8")

    from PIL import Image
    screen_img = Image.fromarray(screen_data, mode='L')
    screen_img_tk = ImageTk.PhotoImage(screen_img)
    label_mental_screen.config(image=screen_img_tk)
    label_mental_screen.image = screen_img_tk  # keep reference

    # 3) Q_value figure -> in-memory buffer -> ImageTk
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

def create_ui(env, max_iterations):
    """
    Creates the main Tkinter application with multiple tabs:
      1) Training & Console
      2) Annotations
      3) Evaluation
      4) Generate (GPT param settings)
    Receives a SelfReinforcingEnvironment object (env) and
    the max_iterations from main.py.
    """
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

    eval_text = scrolledtext.ScrolledText(tab3, width=60, height=5)
    eval_text.config(state='disabled')
    eval_text.pack(pady=5)

    label_mental_screen = tk.Label(tab3, text="Mental Screen 2D")
    label_mental_screen.pack(pady=5)

    label_qvalue_plot = tk.Label(tab3, text="Q_value Plot")
    label_qvalue_plot.pack(pady=5)

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

    gen_param_button = tk.Button(tab4, text="Set GPT Temperature",
        command=lambda: generate_parameters_tab(output_text_tab4))
    gen_param_button.pack(pady=5)

    def generate_gpt_text():
        stage = CONFIG["gpt"]["basic_stage"]
        txt = gpt_train_math_and_generate_text(stage)
        output_text_tab4.insert(tk.END, f"Generated text:\n{txt}\n\n")

    gen_text_button = tk.Button(tab4, text="Generate GPT Text",
        command=generate_gpt_text)
    gen_text_button.pack(pady=5)

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
