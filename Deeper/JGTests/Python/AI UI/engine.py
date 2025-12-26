# engine.py
import os
import json
import datetime
import random
from typing import Dict, Any
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
from dotenv import load_dotenv
import openai
import numpy as np
import cv2  # using opencv-python-headless

# --- Load environment variables ---
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key not found in .env file.")
openai.api_key = OPENAI_API_KEY

# --- Configuration ---
CONFIG = {
    "latent_space": {
        "height": 16,
        "width": 16,
        "channels": 3,
        "time_dim": 1,
        "embed_dim": 128,
        "num_detection_classes": 10,
    },
    "training": {
        "initial_decay_rate": 0.01,
        "desired_performance": 0.9,
        "max_iterations": 10,
        "learning_rate": 0.001,
    },
    "gpt": {
        "basic_stage": "basic_arithmetic",
        "max_tokens": 150,
        "temperature": 0.7,
    }
}

# --- EnhancedLatentSpace class ---
class EnhancedLatentSpace(nn.Module):
    def __init__(self, config: Dict[str, Any]):
        super(EnhancedLatentSpace, self).__init__()
        self.height = config["height"]
        self.width = config["width"]
        self.channels = config["channels"]
        self.embed_dim = config["embed_dim"]
        self.time_dim = config["time_dim"]
        self.flatten_dim = self.height * self.width * self.channels
        
        self.spatial_2d_embedding = nn.Parameter(torch.randn(self.height, self.width, self.embed_dim))
        self.time_embedding = nn.Parameter(torch.randn(self.time_dim, self.embed_dim))
        self.latent_embedding = nn.Linear(self.flatten_dim, self.embed_dim)
        self.yolo_head = nn.Linear(self.embed_dim * 3, config["num_detection_classes"])
    
    def forward(self, x: torch.Tensor, time_index: int = 0) -> torch.Tensor:
        batch_size = x.size(0)
        flattened = x.view(batch_size, -1)
        latent_embed = self.latent_embedding(flattened)
        spatial_2d = self.spatial_2d_embedding.view(-1, self.embed_dim).unsqueeze(0).repeat(batch_size, 1, 1)
        spatial_mean = spatial_2d.mean(dim=1)
        if time_index >= self.time_dim:
            raise ValueError("time_index out of range")
        time_embed = self.time_embedding[time_index].unsqueeze(0).repeat(batch_size, 1)
        combined = torch.cat((latent_embed, spatial_mean, time_embed), dim=1)
        detection_logits = self.yolo_head(combined)
        return detection_logits
    
    def visualize(self, x: torch.Tensor):
        screen_data = x.detach().cpu().numpy().mean(axis=1)
        plt.imshow(screen_data[0], cmap='viridis')
        plt.colorbar()
        plt.title("Latent (Mental) Space Visualization (2D)")
        plt.show()
    
    def neuron_decay(self, decay_rate: float):
        with torch.no_grad():
            self.latent_embedding.weight.mul_(1.0 - decay_rate)
            self.spatial_2d_embedding.mul_(1.0 - decay_rate)
            self.time_embedding.mul_(1.0 - decay_rate)
        print(f"Neuron decay applied with decay rate: {decay_rate:.4f}")

# --- Helper for adaptive forgetting ---
def find_optimal_forgetting_speed(current_performance: float, desired_performance: float, current_decay_rate: float) -> float:
    if current_performance < desired_performance:
        return max(current_decay_rate * 0.95, 0.001)
    else:
        return min(current_decay_rate * 1.05, 0.05)

# --- SelfReinforcingEnvironment class ---
class SelfReinforcingEnvironment:
    def __init__(self, latent_model: EnhancedLatentSpace, decay_rate: float):
        self.latent_model = latent_model
        self.decay_rate = decay_rate
        self.iteration = 0
        self.dynamic_loss = 1.0
    
    def collect_in_knowledge_data(self) -> str:
        data_path = os.path.join("training_data", f"data_iter_{self.iteration}.json")
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        sample_data = {
            "iteration": self.iteration,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "sensor_data": f"reading {random.random()}"
        }
        with open(data_path, "w") as f:
            json.dump(sample_data, f)
        print(f"Data collected at: {data_path}")
        return data_path
    
    def mcts_guided_reasoning(self) -> Dict[str, Any]:
        candidates = []
        for i in range(3):
            candidate = {"step": f"candidate_{i}", "Q_value": random.uniform(0.6, 0.8)}
            candidates.append(candidate)
        best_candidate = max(candidates, key=lambda node: node["Q_value"])
        print("Selected candidate:", best_candidate)
        return best_candidate
    
    def slm_ppm_refinement(self, node: Dict[str, Any]) -> Dict[str, Any]:
        refined = node.copy()
        refined["verified"] = True
        refined["Q_value"] += 0.1
        print("Refined node:", refined)
        return refined
    
    def iterative_refinement(self, node: Dict[str, Any]) -> Dict[str, Any]:
        refined = node.copy()
        refined["Q_value"] += 0.05
        print("Iteratively refined:", refined)
        return refined
    
    def final_selection_and_decay(self, node: Dict[str, Any]):
        print("Final selection:", node)
        if self.iteration % 4 == 0 and self.iteration > 0:
            self.latent_model.neuron_decay(self.decay_rate)
            self.dynamic_loss *= 0.95
            print(f"Dynamic Loss: {self.dynamic_loss:.4f}")
    
    def update_performance(self, node: Dict[str, Any]):
        performance = node.get("Q_value", 0.0)
        self.dynamic_loss = 1.0 / (performance + 1e-6)
        print(f"Updated Loss: {self.dynamic_loss:.4f}")
    
    def run_iteration(self):
        print(f"\n--- Iteration {self.iteration} ---")
        self.collect_in_knowledge_data()
        node = self.mcts_guided_reasoning()
        node = self.slm_ppm_refinement(node)
        node = self.iterative_refinement(node)
        self.final_selection_and_decay(node)
        self.update_performance(node)
        self.decay_rate = find_optimal_forgetting_speed(
            node.get("Q_value", 0.0),
            CONFIG["training"]["desired_performance"],
            self.decay_rate
        )
        self.iteration += 1

# --- GPT Data Generation ---
def gpt_generate_text(stage: str) -> str:
    prompt = (
        f"As an expert math tutor, generate examples and explanations for {stage} math problems. "
        "Start with simple arithmetic and gradually increase the complexity."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are a math tutor."},
                      {"role": "user", "content": prompt}],
            max_tokens=CONFIG["gpt"]["max_tokens"],
            temperature=CONFIG["gpt"]["temperature"]
        )
        training_text = response["choices"][0]["message"]["content"].strip()
    except Exception as e:
        training_text = f"Error generating text: {e}"
    print(f"GPT text for '{stage}':\n{training_text}")
    return training_text

def gpt_generate_image(stage: str) -> str:
    image_path = os.path.join("generated_images", f"{stage}_{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S')}.png")
    os.makedirs(os.path.dirname(image_path), exist_ok=True)
    blank_image = np.zeros((256, 256, 3), np.uint8)
    cv2.imwrite(image_path, blank_image)
    print(f"Simulated image saved at: {image_path}")
    return image_path

# --- Expose hyperparameters if needed ---
def get_current_hyperparameters():
    return CONFIG
