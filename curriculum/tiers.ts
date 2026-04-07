import { Tier } from './types'
import { tier1Lessons } from './tier1-lessons'

export const tiers: Tier[] = [
  {
    id: 1,
    name: 'Foundations',
    description: 'What is AI, ML, deep learning. Core vocabulary. Linear algebra, probability, and calculus refreshers — only what you actually need.',
    prerequisites: [],
    estimatedHours: 15,
    lessons: tier1Lessons
  },
  {
    id: 2,
    name: 'Classical ML',
    description: 'Regression, classification, decision trees, clustering, evaluation metrics. Build it in Python from scratch, then with scikit-learn.',
    prerequisites: [1],
    estimatedHours: 25,
    lessons: []
  },
  {
    id: 3,
    name: 'Neural Networks',
    description: 'Perceptrons, backprop, gradient descent. Build a network by hand in NumPy before touching PyTorch.',
    prerequisites: [2],
    estimatedHours: 20,
    lessons: []
  },
  {
    id: 4,
    name: 'Deep Learning',
    description: 'CNNs, RNNs, transformers. The architecture of modern models.',
    prerequisites: [3],
    estimatedHours: 30,
    lessons: []
  },
  {
    id: 5,
    name: 'Large Language Models',
    description: 'Tokenization, attention, training, fine-tuning, RLHF. How GPT/Claude actually work under the hood.',
    prerequisites: [4],
    estimatedHours: 25,
    lessons: []
  },
  {
    id: 6,
    name: 'Local Inference & Deployment',
    description: 'Running models on your own hardware. Ollama, llama.cpp, quantization, GGUF, vLLM.',
    prerequisites: [5],
    estimatedHours: 20,
    lessons: []
  },
  {
    id: 7,
    name: 'Computer Vision & Multimodal',
    description: 'Image classification, object detection, segmentation. Vision models for real-world use.',
    prerequisites: [4],
    estimatedHours: 25,
    lessons: []
  },
  {
    id: 8,
    name: 'Embodied AI & Robotics',
    description: 'ROS, sensor fusion, reinforcement learning, SLAM. How to put AI inside a physical machine.',
    prerequisites: [7],
    estimatedHours: 30,
    lessons: []
  },
  {
    id: 9,
    name: 'MLOps & Production',
    description: 'Training pipelines, evaluation, monitoring, versioning, deployment.',
    prerequisites: [6],
    estimatedHours: 20,
    lessons: []
  },
  {
    id: 10,
    name: 'Research & Frontier',
    description: 'Reading papers, replicating results, contributing original work.',
    prerequisites: [5, 9],
    estimatedHours: 40,
    lessons: []
  }
]
