# 0001-ec2-basics-for-ai-workloads

## Date
October 5, 2023

## Key Concepts Learned
- EC2 instance types: General Purpose (m6g), Compute Optimized (c6g), Memory Optimized (r6g), GPU Optimized (p3, g4)
- Deep Learning AMI (DL AMI) is pre-configured with ML frameworks (PyTorch, TensorFlow) and CUDA drivers
- Security groups must allow SSH (port 22) for instance access
- Instance types should match workload needs (e.g., GPU for training, m6g for inference)

## Quiz Answers
- GPU instances (p3, g4, etc.) for training
- Deep Learning AMI (DL AMI) for pre-installed ML frameworks
- Allow SSH (port 22) in security group

## Next Steps
- Proceed to Lesson 2: Setting up an EC2 instance for LLM inference
- Apply knowledge by launching a GPU instance for AI workloads