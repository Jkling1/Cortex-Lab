import { LabDefinition } from './types'

export const tier1Labs: LabDefinition[] = [
  {
    id: 'lab-t1-001',
    tierId: 1,
    title: 'Python Basics for ML',
    description: 'Get comfortable with Python fundamentals you\'ll use every day in ML: lists, dicts, list comprehensions, functions, and basic file I/O.',
    difficulty: 'guided',
    relatedLessonIds: ['t1-009'],
    estimatedMinutes: 25,
    prerequisites: [],
    setupInstructions: 'This lab uses pure Python — no external packages needed.',
    exercises: [
      {
        id: 'lab-t1-001-ex1',
        instructions: 'Create a function called `mean` that takes a list of numbers and returns their average. Do NOT use any imports — implement it from scratch using `sum()` and `len()`.',
        starterCode: `def mean(numbers):
    """Calculate the mean of a list of numbers."""
    # Your code here
    pass


# Test it
data = [10, 20, 30, 40, 50]
result = mean(data)
print(f"Mean of {data} = {result}")`,
        solution: `def mean(numbers):
    """Calculate the mean of a list of numbers."""
    return sum(numbers) / len(numbers)


# Test it
data = [10, 20, 30, 40, 50]
result = mean(data)
print(f"Mean of {data} = {result}")`,
        hints: [
          'The mean is the sum of all values divided by the count of values.',
          'Python has built-in sum() and len() functions.',
        ],
        validationCode: `
result = mean([10, 20, 30, 40, 50])
assert abs(result - 30.0) < 0.001, f"Expected 30.0, got {result}"
result2 = mean([1, 2, 3])
assert abs(result2 - 2.0) < 0.001, f"Expected 2.0, got {result2}"
print("PASS")
`
      },
      {
        id: 'lab-t1-001-ex2',
        instructions: 'Create a function called `normalize` that takes a list of numbers and returns a new list where each value is scaled to be between 0 and 1. Formula: `(x - min) / (max - min)` for each value.',
        starterCode: `def normalize(numbers):
    """Normalize a list of numbers to [0, 1] range."""
    # Your code here
    pass


# Test it
data = [10, 20, 30, 40, 50]
result = normalize(data)
print(f"Normalized: {result}")
# Expected: [0.0, 0.25, 0.5, 0.75, 1.0]`,
        solution: `def normalize(numbers):
    """Normalize a list of numbers to [0, 1] range."""
    min_val = min(numbers)
    max_val = max(numbers)
    return [(x - min_val) / (max_val - min_val) for x in numbers]


# Test it
data = [10, 20, 30, 40, 50]
result = normalize(data)
print(f"Normalized: {result}")`,
        hints: [
          'First find the min and max of the list.',
          'Use a list comprehension to apply the formula to each element.',
          'Python has built-in min() and max() functions.'
        ],
        validationCode: `
result = normalize([10, 20, 30, 40, 50])
expected = [0.0, 0.25, 0.5, 0.75, 1.0]
for r, e in zip(result, expected):
    assert abs(r - e) < 0.001, f"Expected {e}, got {r}"
print("PASS")
`
      },
      {
        id: 'lab-t1-001-ex3',
        instructions: 'Create a function called `train_test_split` that takes a list and a ratio (default 0.8), and returns two lists: the first `ratio` fraction of elements as "train", and the rest as "test". No randomization needed — just split at the index.',
        starterCode: `def train_test_split(data, ratio=0.8):
    """Split data into train and test sets."""
    # Your code here
    pass


# Test it
data = list(range(10))  # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
train, test = train_test_split(data)
print(f"Train: {train}")
print(f"Test:  {test}")
# Expected: Train: [0,1,2,3,4,5,6,7], Test: [8,9]`,
        solution: `def train_test_split(data, ratio=0.8):
    """Split data into train and test sets."""
    split_idx = int(len(data) * ratio)
    return data[:split_idx], data[split_idx:]


# Test it
data = list(range(10))
train, test = train_test_split(data)
print(f"Train: {train}")
print(f"Test:  {test}")`,
        hints: [
          'Calculate the split index: int(len(data) * ratio)',
          'Use Python list slicing: data[:idx] and data[idx:]'
        ],
        validationCode: `
train, test = train_test_split(list(range(10)), 0.8)
assert train == [0,1,2,3,4,5,6,7], f"Train wrong: {train}"
assert test == [8,9], f"Test wrong: {test}"
train2, test2 = train_test_split(list(range(20)), 0.5)
assert len(train2) == 10 and len(test2) == 10, "50/50 split failed"
print("PASS")
`
      }
    ]
  },
  {
    id: 'lab-t1-002',
    tierId: 1,
    title: 'NumPy Linear Algebra',
    description: 'Hands-on with NumPy: create arrays, perform matrix operations, and see why vectorized math is the backbone of ML.',
    difficulty: 'build',
    relatedLessonIds: ['t1-006', 't1-009'],
    estimatedMinutes: 30,
    prerequisites: ['lab-t1-001'],
    setupInstructions: 'This lab requires NumPy. Run: pip install numpy',
    exercises: [
      {
        id: 'lab-t1-002-ex1',
        instructions: 'Create a function called `dot_product` that computes the dot product of two lists WITHOUT using NumPy. Then create `np_dot_product` that does the same thing using `numpy.dot()`. Print both results to verify they match.',
        starterCode: `import numpy as np

def dot_product(a, b):
    """Compute dot product without NumPy."""
    # Your code here
    pass

def np_dot_product(a, b):
    """Compute dot product using NumPy."""
    # Your code here
    pass


# Test
a = [1, 2, 3, 4]
b = [5, 6, 7, 8]
print(f"Manual: {dot_product(a, b)}")
print(f"NumPy:  {np_dot_product(a, b)}")
# Expected: 70`,
        solution: `import numpy as np

def dot_product(a, b):
    """Compute dot product without NumPy."""
    return sum(x * y for x, y in zip(a, b))

def np_dot_product(a, b):
    """Compute dot product using NumPy."""
    return np.dot(np.array(a), np.array(b))


# Test
a = [1, 2, 3, 4]
b = [5, 6, 7, 8]
print(f"Manual: {dot_product(a, b)}")
print(f"NumPy:  {np_dot_product(a, b)}")`,
        hints: [
          'Dot product = sum of element-wise products: a[0]*b[0] + a[1]*b[1] + ...',
          'Use zip() to iterate pairs, or a list comprehension.',
          'np.dot() handles it in one call.'
        ],
        validationCode: `
import numpy as np
r1 = dot_product([1,2,3,4], [5,6,7,8])
assert r1 == 70, f"Manual dot product expected 70, got {r1}"
r2 = np_dot_product([1,2,3,4], [5,6,7,8])
assert int(r2) == 70, f"NumPy dot product expected 70, got {r2}"
print("PASS")
`
      },
      {
        id: 'lab-t1-002-ex2',
        instructions: 'Create a function called `matrix_multiply` that takes two 2D NumPy arrays and returns their matrix product using `np.matmul()` (or the `@` operator). Then create a 3x2 matrix A and a 2x4 matrix B, multiply them, and print the result shape.',
        starterCode: `import numpy as np

def matrix_multiply(A, B):
    """Multiply two matrices using NumPy."""
    # Your code here
    pass


# Create matrices and multiply
A = None  # Create a 3x2 matrix of your choice
B = None  # Create a 2x4 matrix of your choice

C = matrix_multiply(A, B)
print(f"A shape: {A.shape}")
print(f"B shape: {B.shape}")
print(f"C shape: {C.shape}")
print(f"Result:\\n{C}")`,
        solution: `import numpy as np

def matrix_multiply(A, B):
    """Multiply two matrices using NumPy."""
    return A @ B


# Create matrices and multiply
A = np.array([[1, 2], [3, 4], [5, 6]])  # 3x2
B = np.array([[1, 2, 3, 4], [5, 6, 7, 8]])  # 2x4

C = matrix_multiply(A, B)
print(f"A shape: {A.shape}")
print(f"B shape: {B.shape}")
print(f"C shape: {C.shape}")
print(f"Result:\\n{C}")`,
        hints: [
          'Use the @ operator or np.matmul() for matrix multiplication.',
          'A 3x2 matrix times a 2x4 matrix gives a 3x4 result.',
          'np.array([[1,2],[3,4],[5,6]]) creates a 3x2 matrix.'
        ],
        validationCode: `
import numpy as np
A = np.array([[1,2],[3,4],[5,6]])
B = np.array([[1,2,3,4],[5,6,7,8]])
C = matrix_multiply(A, B)
assert C.shape == (3, 4), f"Expected shape (3,4), got {C.shape}"
assert C[0][0] == 11, f"Expected C[0][0]=11, got {C[0][0]}"
print("PASS")
`
      },
      {
        id: 'lab-t1-002-ex3',
        instructions: 'Create a function called `cosine_similarity` that computes the cosine similarity between two NumPy vectors. Formula: `(A . B) / (||A|| * ||B||)` where `||A||` is the L2 norm. Use `np.dot()` and `np.linalg.norm()`.',
        starterCode: `import numpy as np

def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    # Your code here
    pass


# Test: identical vectors should have similarity 1.0
v1 = np.array([1, 2, 3])
v2 = np.array([1, 2, 3])
print(f"Identical: {cosine_similarity(v1, v2):.4f}")  # Expected: 1.0

# Orthogonal vectors should have similarity 0.0
v3 = np.array([1, 0])
v4 = np.array([0, 1])
print(f"Orthogonal: {cosine_similarity(v3, v4):.4f}")  # Expected: 0.0

# Opposite vectors should have similarity -1.0
v5 = np.array([1, 2, 3])
v6 = np.array([-1, -2, -3])
print(f"Opposite: {cosine_similarity(v5, v6):.4f}")  # Expected: -1.0`,
        solution: `import numpy as np

def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


v1 = np.array([1, 2, 3])
v2 = np.array([1, 2, 3])
print(f"Identical: {cosine_similarity(v1, v2):.4f}")

v3 = np.array([1, 0])
v4 = np.array([0, 1])
print(f"Orthogonal: {cosine_similarity(v3, v4):.4f}")

v5 = np.array([1, 2, 3])
v6 = np.array([-1, -2, -3])
print(f"Opposite: {cosine_similarity(v5, v6):.4f}")`,
        hints: [
          'np.linalg.norm(v) gives the L2 norm (length) of a vector.',
          'Cosine similarity = dot product / (norm_a * norm_b)',
          'The result ranges from -1 (opposite) to 1 (identical).'
        ],
        validationCode: `
import numpy as np
r1 = cosine_similarity(np.array([1,2,3]), np.array([1,2,3]))
assert abs(r1 - 1.0) < 0.001, f"Identical vectors: expected 1.0, got {r1}"
r2 = cosine_similarity(np.array([1,0]), np.array([0,1]))
assert abs(r2) < 0.001, f"Orthogonal: expected 0.0, got {r2}"
r3 = cosine_similarity(np.array([1,2,3]), np.array([-1,-2,-3]))
assert abs(r3 - (-1.0)) < 0.001, f"Opposite: expected -1.0, got {r3}"
print("PASS")
`
      }
    ]
  },
  {
    id: 'lab-t1-003',
    tierId: 1,
    title: 'Build Linear Regression from Scratch',
    description: 'Implement gradient descent for linear regression using only NumPy. No scikit-learn — you\'ll understand every line of the training loop.',
    difficulty: 'build',
    relatedLessonIds: ['t1-010', 't1-008', 't1-006'],
    estimatedMinutes: 40,
    prerequisites: ['lab-t1-002'],
    setupInstructions: 'This lab requires NumPy. Run: pip install numpy',
    exercises: [
      {
        id: 'lab-t1-003-ex1',
        instructions: 'Create a function called `predict` that computes predictions for linear regression: `y_hat = X * w + b`. X is a NumPy array of shape (n_samples,), w is a scalar weight, b is a scalar bias. Also create `mse_loss` that computes mean squared error between predictions and targets.',
        starterCode: `import numpy as np

def predict(X, w, b):
    """Linear regression prediction: y_hat = X * w + b"""
    # Your code here
    pass

def mse_loss(y_true, y_pred):
    """Mean squared error loss."""
    # Your code here
    pass


# Test with simple data
X = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 4, 6, 8, 10], dtype=float)  # y = 2x

# Perfect weights
y_hat = predict(X, w=2.0, b=0.0)
loss = mse_loss(y, y_hat)
print(f"Predictions: {y_hat}")
print(f"MSE Loss (perfect): {loss}")  # Should be 0.0

# Bad weights
y_hat_bad = predict(X, w=1.0, b=0.0)
loss_bad = mse_loss(y, y_hat_bad)
print(f"MSE Loss (bad): {loss_bad}")  # Should be > 0`,
        solution: `import numpy as np

def predict(X, w, b):
    """Linear regression prediction: y_hat = X * w + b"""
    return X * w + b

def mse_loss(y_true, y_pred):
    """Mean squared error loss."""
    return np.mean((y_true - y_pred) ** 2)


X = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 4, 6, 8, 10], dtype=float)

y_hat = predict(X, w=2.0, b=0.0)
loss = mse_loss(y, y_hat)
print(f"Predictions: {y_hat}")
print(f"MSE Loss (perfect): {loss}")

y_hat_bad = predict(X, w=1.0, b=0.0)
loss_bad = mse_loss(y, y_hat_bad)
print(f"MSE Loss (bad): {loss_bad}")`,
        hints: [
          'predict: just return X * w + b — NumPy handles element-wise multiplication.',
          'MSE: mean of (y_true - y_pred) squared. Use np.mean().'
        ],
        validationCode: `
import numpy as np
X = np.array([1,2,3,4,5], dtype=float)
y = np.array([2,4,6,8,10], dtype=float)
y_hat = predict(X, 2.0, 0.0)
assert np.allclose(y_hat, y), f"predict(X, 2, 0) should equal y"
loss = mse_loss(y, y_hat)
assert abs(loss) < 0.001, f"Perfect prediction should have ~0 loss, got {loss}"
loss_bad = mse_loss(y, predict(X, 1.0, 0.0))
assert loss_bad > 0, "Bad weights should have positive loss"
print("PASS")
`
      },
      {
        id: 'lab-t1-003-ex2',
        instructions: 'Create a function called `compute_gradients` that computes the gradients of MSE loss with respect to weight `w` and bias `b`. The gradients are:\n- `dw = (2/n) * sum((y_pred - y_true) * X)`\n- `db = (2/n) * sum(y_pred - y_true)`\n\nwhere n is the number of samples.',
        starterCode: `import numpy as np

def predict(X, w, b):
    return X * w + b

def compute_gradients(X, y_true, y_pred):
    """Compute gradients of MSE loss w.r.t. w and b."""
    n = len(X)
    # Your code here
    dw = None
    db = None
    return dw, db


# Test
X = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 4, 6, 8, 10], dtype=float)

# With bad weights, gradients should point toward correction
y_pred = predict(X, w=1.0, b=0.0)  # Under-predicting
dw, db = compute_gradients(X, y, y_pred)
print(f"dw = {dw}, db = {db}")
# dw should be negative (need to increase w)
# db should be negative (need to increase b)`,
        solution: `import numpy as np

def predict(X, w, b):
    return X * w + b

def compute_gradients(X, y_true, y_pred):
    """Compute gradients of MSE loss w.r.t. w and b."""
    n = len(X)
    error = y_pred - y_true
    dw = (2 / n) * np.sum(error * X)
    db = (2 / n) * np.sum(error)
    return dw, db


X = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 4, 6, 8, 10], dtype=float)

y_pred = predict(X, w=1.0, b=0.0)
dw, db = compute_gradients(X, y, y_pred)
print(f"dw = {dw}, db = {db}")`,
        hints: [
          'First compute the error: y_pred - y_true',
          'dw uses element-wise multiplication of error and X, then sum and scale by 2/n',
          'db is just the sum of errors scaled by 2/n'
        ],
        validationCode: `
import numpy as np
X = np.array([1,2,3,4,5], dtype=float)
y = np.array([2,4,6,8,10], dtype=float)
y_pred = predict(X, 1.0, 0.0)
dw, db = compute_gradients(X, y, y_pred)
assert abs(dw - (-14.0)) < 0.01, f"Expected dw=-14.0, got {dw}"
assert abs(db - (-4.0)) < 0.01, f"Expected db=-4.0, got {db}"
print("PASS")
`
      },
      {
        id: 'lab-t1-003-ex3',
        instructions: 'Now put it all together! Create a function called `train_linear_regression` that:\n1. Initializes w=0, b=0\n2. Runs gradient descent for a given number of epochs\n3. Each epoch: predict → compute gradients → update weights (w -= lr * dw, b -= lr * db)\n4. Returns final w, b, and a list of losses per epoch\n\nTrain on the data y = 2x + 1 and verify the model learns w≈2, b≈1.',
        starterCode: `import numpy as np

def predict(X, w, b):
    return X * w + b

def mse_loss(y_true, y_pred):
    return np.mean((y_true - y_pred) ** 2)

def compute_gradients(X, y_true, y_pred):
    n = len(X)
    error = y_pred - y_true
    dw = (2 / n) * np.sum(error * X)
    db = (2 / n) * np.sum(error)
    return dw, db

def train_linear_regression(X, y, lr=0.01, epochs=1000):
    """Train linear regression using gradient descent."""
    # Your code here
    pass


# Generate data: y = 2x + 1
np.random.seed(42)
X = np.linspace(0, 10, 50)
y = 2 * X + 1 + np.random.randn(50) * 0.5  # Add some noise

w, b, losses = train_linear_regression(X, y, lr=0.001, epochs=2000)
print(f"Learned: w = {w:.4f}, b = {b:.4f}")
print(f"Expected: w ≈ 2.0, b ≈ 1.0")
print(f"Final loss: {losses[-1]:.4f}")
print(f"Loss decreased: {losses[0]:.2f} → {losses[-1]:.4f}")`,
        solution: `import numpy as np

def predict(X, w, b):
    return X * w + b

def mse_loss(y_true, y_pred):
    return np.mean((y_true - y_pred) ** 2)

def compute_gradients(X, y_true, y_pred):
    n = len(X)
    error = y_pred - y_true
    dw = (2 / n) * np.sum(error * X)
    db = (2 / n) * np.sum(error)
    return dw, db

def train_linear_regression(X, y, lr=0.01, epochs=1000):
    """Train linear regression using gradient descent."""
    w = 0.0
    b = 0.0
    losses = []
    for _ in range(epochs):
        y_pred = predict(X, w, b)
        loss = mse_loss(y, y_pred)
        losses.append(loss)
        dw, db = compute_gradients(X, y, y_pred)
        w -= lr * dw
        b -= lr * db
    return w, b, losses


np.random.seed(42)
X = np.linspace(0, 10, 50)
y = 2 * X + 1 + np.random.randn(50) * 0.5

w, b, losses = train_linear_regression(X, y, lr=0.001, epochs=2000)
print(f"Learned: w = {w:.4f}, b = {b:.4f}")
print(f"Expected: w ≈ 2.0, b ≈ 1.0")
print(f"Final loss: {losses[-1]:.4f}")
print(f"Loss decreased: {losses[0]:.2f} → {losses[-1]:.4f}")`,
        hints: [
          'Initialize w = 0.0 and b = 0.0',
          'Each epoch: predict → loss → gradients → update',
          'Update rule: w = w - lr * dw, b = b - lr * db',
          'Collect losses in a list to track convergence.'
        ],
        validationCode: `
import numpy as np
np.random.seed(42)
X = np.linspace(0, 10, 50)
y = 2 * X + 1 + np.random.randn(50) * 0.5
w, b, losses = train_linear_regression(X, y, lr=0.001, epochs=2000)
assert abs(w - 2.0) < 0.2, f"w should be ~2.0, got {w:.4f}"
assert abs(b - 1.0) < 1.0, f"b should be ~1.0, got {b:.4f}"
assert losses[-1] < losses[0], "Loss should decrease during training"
assert len(losses) == 2000, f"Expected 2000 losses, got {len(losses)}"
print("PASS")
`
      }
    ]
  }
]
