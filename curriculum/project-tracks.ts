import { ProjectTrack } from './types'

export const projectTracks: ProjectTrack[] = [
  {
    id: 'local-llm-stack',
    name: 'Local LLM Stack',
    tagline: 'Run your own AI on your own hardware',
    description: 'Build a complete local LLM deployment: install Ollama, run open-source models on your Mac Mini M4, set up Open WebUI, fine-tune a model on your own data, and serve it across your network.',
    icon: '\u{1F5A5}',
    color: '#7c6af6',
    milestones: [
      {
        id: 'llm-m1',
        title: 'Understand How LLMs Work',
        description: 'Before running a model locally, understand what it actually does — tokenization, attention, inference.',
        order: 1,
        relatedLessonIds: ['t1-004', 't1-005'],
        relatedLabIds: [],
        relatedTierIds: [1, 5],
        deliverable: 'Write a 1-page summary of how a transformer processes a prompt from input to output.',
        checkpoints: [
          'Explain tokenization and why it matters',
          'Describe the attention mechanism at a high level',
          'Understand the difference between training and inference'
        ]
      },
      {
        id: 'llm-m2',
        title: 'Install & Run Ollama',
        description: 'Get Ollama running on your machine, pull a model, and have your first local conversation.',
        order: 2,
        relatedLessonIds: ['t1-009'],
        relatedLabIds: [],
        relatedTierIds: [6],
        deliverable: 'Ollama running locally with at least one model responding to prompts.',
        checkpoints: [
          'Install Ollama on your machine',
          'Pull a small model (e.g., Llama 3.2 3B or Phi-3)',
          'Run a conversation from the terminal',
          'Check GPU/memory usage during inference'
        ]
      },
      {
        id: 'llm-m3',
        title: 'Quantization & Model Formats',
        description: 'Understand GGUF, quantization levels (Q4, Q8, F16), and how they trade quality for speed/memory.',
        order: 3,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [5, 6],
        deliverable: 'Benchmark 3 quantization levels of the same model on your hardware (speed, memory, quality).',
        checkpoints: [
          'Explain what quantization does and why it matters',
          'Understand GGUF format vs original weights',
          'Compare Q4_K_M vs Q8_0 vs F16 on the same prompt',
          'Document inference speed and memory for each'
        ]
      },
      {
        id: 'llm-m4',
        title: 'Set Up Open WebUI',
        description: 'Deploy a web interface for your local models so you can chat from any device on your network.',
        order: 4,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [6, 9],
        deliverable: 'Open WebUI running and accessible from your phone/other devices on local network.',
        checkpoints: [
          'Install Open WebUI (Docker or native)',
          'Connect it to your Ollama instance',
          'Access from another device on the same network',
          'Test with multiple models'
        ]
      },
      {
        id: 'llm-m5',
        title: 'Build an API Pipeline',
        description: 'Write a Python script that sends prompts to your local model via the Ollama API and processes responses programmatically.',
        order: 5,
        relatedLessonIds: ['t1-009'],
        relatedLabIds: ['lab-t1-001'],
        relatedTierIds: [6, 9],
        deliverable: 'A Python script that takes a question, sends it to your local model, and formats the response.',
        checkpoints: [
          'Use the Ollama REST API from Python',
          'Handle streaming responses',
          'Add system prompts and conversation history',
          'Measure latency and tokens/second'
        ]
      },
      {
        id: 'llm-m6',
        title: 'Fine-Tune a Model',
        description: 'Take a base model and fine-tune it on your own dataset to specialize its behavior.',
        order: 6,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [5, 6],
        deliverable: 'A fine-tuned model loaded into Ollama that demonstrably performs better on your specific use case.',
        checkpoints: [
          'Prepare a training dataset (at least 100 examples)',
          'Choose a fine-tuning method (LoRA/QLoRA)',
          'Run the fine-tuning process',
          'Convert to GGUF and load into Ollama',
          'Compare base vs fine-tuned on test prompts'
        ]
      }
    ]
  },
  {
    id: 'ironhound-brain',
    name: 'IronHound Brain',
    tagline: 'Vision tracking, sensor fusion, pathfinding',
    description: 'Build the AI brain for a robotic follow-me trainer (IronHound). Start with computer vision for person tracking, add sensor fusion, then implement autonomous pathfinding and obstacle avoidance.',
    icon: '\u{1F916}',
    color: '#f97316',
    milestones: [
      {
        id: 'ih-m1',
        title: 'Computer Vision Foundations',
        description: 'Understand how machines "see" — from pixels to feature maps to object detection.',
        order: 1,
        relatedLessonIds: ['t1-001', 't1-003', 't1-004'],
        relatedLabIds: [],
        relatedTierIds: [1, 4, 7],
        deliverable: 'Load an image, run it through a pre-trained model, and visualize the detections.',
        checkpoints: [
          'Understand how CNNs process images',
          'Know the difference between classification, detection, and segmentation',
          'Run a pre-trained YOLO or SSD model on sample images',
          'Visualize bounding boxes and confidence scores'
        ]
      },
      {
        id: 'ih-m2',
        title: 'Real-Time Person Detection',
        description: 'Get a camera feed, detect people in real-time, and track them across frames.',
        order: 2,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [7],
        deliverable: 'A Python script that uses your webcam to detect and track a person in real-time.',
        checkpoints: [
          'Set up OpenCV video capture',
          'Run person detection on each frame',
          'Implement basic tracking (centroid or SORT)',
          'Measure and optimize FPS'
        ]
      },
      {
        id: 'ih-m3',
        title: 'Depth Estimation & Distance',
        description: 'Estimate how far away the tracked person is using monocular depth estimation or stereo vision.',
        order: 3,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [7, 8],
        deliverable: 'Distance estimate displayed alongside the tracked person in the camera feed.',
        checkpoints: [
          'Understand depth estimation techniques',
          'Implement monocular depth with MiDaS or similar',
          'Calibrate distance estimates against real measurements',
          'Combine depth with person tracking'
        ]
      },
      {
        id: 'ih-m4',
        title: 'Sensor Fusion Basics',
        description: 'Combine camera data with IMU/GPS sensors for more robust tracking.',
        order: 4,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [7, 8],
        deliverable: 'A fused tracking system that maintains person location using both vision and sensor data.',
        checkpoints: [
          'Understand Kalman filtering for sensor fusion',
          'Read data from IMU sensors',
          'Fuse vision-based tracking with sensor data',
          'Handle sensor dropouts gracefully'
        ]
      },
      {
        id: 'ih-m5',
        title: 'Pathfinding & Obstacle Avoidance',
        description: 'Implement autonomous navigation — follow the person while avoiding obstacles.',
        order: 5,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [8],
        deliverable: 'A simulation showing the robot following a target while avoiding obstacles.',
        checkpoints: [
          'Implement A* or RRT pathfinding',
          'Build a simple obstacle map from sensor data',
          'Create a following behavior (maintain distance + heading)',
          'Test in simulation before hardware'
        ]
      }
    ]
  },
  {
    id: '815-farmacy-ai',
    name: '815 Farmacy AI',
    tagline: 'Plant disease detection, pest classification, automation',
    description: 'Build AI tools for precision agriculture: detect plant diseases from leaf images, classify pests, monitor crop health, and trigger automated responses.',
    icon: '\u{1F331}',
    color: '#22c55e',
    milestones: [
      {
        id: 'farm-m1',
        title: 'Image Classification Basics',
        description: 'Learn to build an image classifier — the foundation for plant disease detection.',
        order: 1,
        relatedLessonIds: ['t1-003', 't1-004'],
        relatedLabIds: [],
        relatedTierIds: [1, 4, 7],
        deliverable: 'Train an image classifier on a simple dataset (e.g., cats vs dogs) with >90% accuracy.',
        checkpoints: [
          'Understand training/validation/test splits for images',
          'Build a CNN classifier in PyTorch',
          'Train with data augmentation',
          'Evaluate with confusion matrix and accuracy'
        ]
      },
      {
        id: 'farm-m2',
        title: 'Plant Disease Detection',
        description: 'Train a model to identify common plant diseases from leaf photos.',
        order: 2,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [7],
        deliverable: 'A model that classifies at least 5 plant diseases from leaf images with >85% accuracy.',
        checkpoints: [
          'Find and prepare a plant disease dataset (PlantVillage or similar)',
          'Apply transfer learning from a pre-trained model',
          'Train and evaluate the disease classifier',
          'Build a simple inference script that takes a photo and returns diagnosis'
        ]
      },
      {
        id: 'farm-m3',
        title: 'Pest Classification',
        description: 'Detect and classify common garden pests from camera trap or close-up images.',
        order: 3,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [7],
        deliverable: 'A pest classifier that identifies at least 8 common pest species.',
        checkpoints: [
          'Collect or source a pest image dataset',
          'Train an object detection model (YOLO) for pest detection',
          'Add classification for pest species',
          'Test on real garden images'
        ]
      },
      {
        id: 'farm-m4',
        title: 'Monitoring Dashboard',
        description: 'Build a dashboard that aggregates detection results over time and shows crop health trends.',
        order: 4,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [9],
        deliverable: 'A web dashboard showing disease/pest detection history with trend charts.',
        checkpoints: [
          'Design a data schema for detection events',
          'Build an API that logs detections',
          'Create a dashboard with charts (detections over time, health score)',
          'Add alerts for new disease/pest detections'
        ]
      },
      {
        id: 'farm-m5',
        title: 'Automation Triggers',
        description: 'Connect detection results to real actions — notifications, irrigation control, or treatment schedules.',
        order: 5,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [8, 9],
        deliverable: 'An automation system that takes action based on AI detections (even if simulated).',
        checkpoints: [
          'Define trigger rules (e.g., "if disease X detected, notify + schedule treatment")',
          'Implement a webhook or MQTT integration',
          'Build a rule engine for automated responses',
          'Test end-to-end: detection → trigger → action'
        ]
      }
    ]
  },
  {
    id: 'coaching-ai',
    name: 'Coaching AI',
    tagline: 'Build a model that critiques your training data',
    description: 'Build an AI coaching assistant that analyzes workout data, provides form feedback from video, tracks progress, and generates personalized training recommendations.',
    icon: '\u{1F3CB}',
    color: '#eab308',
    milestones: [
      {
        id: 'coach-m1',
        title: 'Training Data Analysis',
        description: 'Build a pipeline to ingest, clean, and analyze workout/training data.',
        order: 1,
        relatedLessonIds: ['t1-009', 't1-010'],
        relatedLabIds: ['lab-t1-001', 'lab-t1-003'],
        relatedTierIds: [1, 2],
        deliverable: 'A Python notebook that loads training data and produces summary statistics and visualizations.',
        checkpoints: [
          'Define a schema for training data (exercises, sets, reps, weight, RPE)',
          'Build data ingestion from CSV or API',
          'Calculate key metrics (volume, intensity, frequency)',
          'Visualize trends with matplotlib'
        ]
      },
      {
        id: 'coach-m2',
        title: 'Progress Prediction Model',
        description: 'Build a regression model that predicts future performance based on training history.',
        order: 2,
        relatedLessonIds: ['t1-010'],
        relatedLabIds: ['lab-t1-003'],
        relatedTierIds: [2],
        deliverable: 'A model that predicts next-session performance with reasonable accuracy.',
        checkpoints: [
          'Engineer features from training history (rolling averages, fatigue indicators)',
          'Train a regression model on historical data',
          'Evaluate with RMSE and R-squared',
          'Generate "expected performance" predictions for next session'
        ]
      },
      {
        id: 'coach-m3',
        title: 'Movement Analysis from Video',
        description: 'Use pose estimation to analyze exercise form from video clips.',
        order: 3,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [7],
        deliverable: 'A script that takes a video of a squat/deadlift and provides joint angle analysis.',
        checkpoints: [
          'Set up MediaPipe or OpenPose for pose estimation',
          'Extract key joint positions from exercise video',
          'Calculate joint angles (knee, hip, shoulder)',
          'Flag form deviations from ideal movement patterns'
        ]
      },
      {
        id: 'coach-m4',
        title: 'AI Training Recommendations',
        description: 'Use an LLM to generate personalized training recommendations based on data analysis.',
        order: 4,
        relatedLessonIds: [],
        relatedLabIds: [],
        relatedTierIds: [5, 6],
        deliverable: 'An AI coaching chatbot that answers questions about your training and suggests adjustments.',
        checkpoints: [
          'Structure training data into a prompt-friendly format',
          'Build a RAG pipeline: training history → context → LLM → recommendation',
          'Implement conversation history for follow-up questions',
          'Test recommendations against known coaching principles'
        ]
      }
    ]
  }
]
