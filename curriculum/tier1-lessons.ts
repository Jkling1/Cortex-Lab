import { LessonDefinition } from './types'

export const tier1Lessons: LessonDefinition[] = [
  {
    id: 't1-001',
    tierId: 1,
    title: 'What is Artificial Intelligence?',
    description: 'The big picture: what AI actually is, what it isn\'t, and why it matters right now.',
    order: 1,
    concepts: ['artificial intelligence', 'narrow AI vs AGI', 'AI history', 'AI winter', 'modern AI renaissance'],
    objectives: [
      'Define AI in practical terms, not sci-fi terms',
      'Explain the difference between narrow AI and general AI',
      'Describe the key milestones in AI history (Turing, expert systems, deep learning revolution)',
      'Understand why AI exploded in the last decade (data + compute + algorithms)'
    ],
    estimatedMinutes: 30
  },
  {
    id: 't1-002',
    tierId: 1,
    title: 'Machine Learning vs Traditional Programming',
    description: 'The fundamental shift: instead of writing rules, you show examples and let the machine learn the rules.',
    order: 2,
    concepts: ['machine learning', 'traditional programming', 'training data', 'models', 'inference'],
    objectives: [
      'Explain the paradigm shift from explicit rules to learned patterns',
      'Understand the ML workflow: data → training → model → inference',
      'Know when ML is the right tool and when traditional code is better',
      'Identify real-world examples of ML in everyday products'
    ],
    estimatedMinutes: 25
  },
  {
    id: 't1-003',
    tierId: 1,
    title: 'Types of Machine Learning',
    description: 'Supervised, unsupervised, and reinforcement learning — the three families and when to use each.',
    order: 3,
    concepts: ['supervised learning', 'unsupervised learning', 'reinforcement learning', 'labels', 'classification', 'regression', 'clustering'],
    objectives: [
      'Define and differentiate supervised, unsupervised, and reinforcement learning',
      'Give concrete examples of each type',
      'Understand what labeled vs unlabeled data means',
      'Know the difference between classification and regression tasks'
    ],
    estimatedMinutes: 30
  },
  {
    id: 't1-004',
    tierId: 1,
    title: 'Deep Learning & Neural Networks Overview',
    description: 'What neural networks are at a high level — the building blocks of modern AI, without the math (yet).',
    order: 4,
    concepts: ['neural networks', 'deep learning', 'neurons', 'layers', 'weights', 'activation functions'],
    objectives: [
      'Explain what a neural network is using intuitive analogies',
      'Understand why "deep" learning means many layers',
      'Know the basic components: inputs, weights, activation, output',
      'Understand why deep learning dominates modern AI (representation learning)'
    ],
    estimatedMinutes: 30
  },
  {
    id: 't1-005',
    tierId: 1,
    title: 'The AI/ML Vocabulary Toolkit',
    description: 'Master the essential jargon: features, labels, epochs, loss, overfitting, and more.',
    order: 5,
    concepts: ['features', 'labels', 'training/validation/test split', 'epochs', 'batch size', 'loss function', 'overfitting', 'underfitting', 'hyperparameters'],
    objectives: [
      'Define the 20 most common ML terms and use them correctly',
      'Understand the train/validation/test split and why it matters',
      'Explain overfitting and underfitting intuitively',
      'Know what hyperparameters are vs learned parameters'
    ],
    estimatedMinutes: 35
  },
  {
    id: 't1-006',
    tierId: 1,
    title: 'Math Refresher: Linear Algebra Essentials',
    description: 'Vectors, matrices, dot products, and matrix multiplication — the language neural networks speak.',
    order: 6,
    concepts: ['vectors', 'matrices', 'dot product', 'matrix multiplication', 'transpose', 'vector spaces'],
    objectives: [
      'Understand vectors as points in space and as data representations',
      'Perform matrix multiplication by hand on small examples',
      'Know why linear algebra is the backbone of ML computations',
      'Connect matrix operations to neural network forward passes'
    ],
    estimatedMinutes: 45
  },
  {
    id: 't1-007',
    tierId: 1,
    title: 'Math Refresher: Probability & Statistics Basics',
    description: 'Probability distributions, Bayes\' theorem, and the statistical thinking behind ML.',
    order: 7,
    concepts: ['probability', 'distributions', 'mean/variance/std', 'Bayes theorem', 'conditional probability', 'maximum likelihood'],
    objectives: [
      'Calculate basic probabilities and understand distributions',
      'Apply Bayes\' theorem to simple problems',
      'Understand why ML is fundamentally probabilistic',
      'Know what a likelihood function is and why it matters for training'
    ],
    estimatedMinutes: 45
  },
  {
    id: 't1-008',
    tierId: 1,
    title: 'Math Refresher: Calculus for ML',
    description: 'Derivatives, gradients, and the chain rule — just enough to understand how models learn.',
    order: 8,
    concepts: ['derivatives', 'partial derivatives', 'gradients', 'chain rule', 'gradient descent intuition'],
    objectives: [
      'Understand a derivative as the slope/rate of change',
      'Compute simple partial derivatives',
      'Know what a gradient is and which direction it points',
      'Connect the chain rule to backpropagation (preview)'
    ],
    estimatedMinutes: 40
  },
  {
    id: 't1-009',
    tierId: 1,
    title: 'Python for ML: Environment Setup',
    description: 'Get your local Python environment ready for machine learning work.',
    order: 9,
    concepts: ['Python', 'pip', 'virtual environments', 'NumPy', 'Jupyter', 'pandas basics'],
    objectives: [
      'Set up a Python virtual environment for ML work',
      'Install and verify NumPy, pandas, matplotlib, and Jupyter',
      'Write basic NumPy array operations',
      'Understand why NumPy is fast (vectorization vs loops)'
    ],
    estimatedMinutes: 30
  },
  {
    id: 't1-010',
    tierId: 1,
    title: 'Your First ML Concept: Linear Regression Intuition',
    description: 'The simplest ML algorithm — fit a line to data. Understand the core loop: predict, measure error, update.',
    order: 10,
    concepts: ['linear regression', 'cost function', 'mean squared error', 'gradient descent', 'learning rate', 'convergence'],
    objectives: [
      'Explain linear regression as finding the best-fit line',
      'Understand the cost function (MSE) and what minimizing it means',
      'Walk through gradient descent step by step',
      'Know what learning rate does and what happens when it\'s too high/low'
    ],
    estimatedMinutes: 40
  }
]
