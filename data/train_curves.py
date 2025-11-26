import matplotlib.pyplot as plt
import numpy as np

# fake curves
epochs = np.arange(1, 11)
train_loss = np.exp(-epochs/3) + 0.05*np.random.rand(len(epochs))
val_loss = np.exp(-epochs/2.5) + 0.1*np.random.rand(len(epochs))

plt.plot(epochs, train_loss, label="Train Loss")
plt.plot(epochs, val_loss, label="Val Loss")
plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.legend()
plt.title("Training & Validation Loss (placeholder)")
plt.savefig("loss_curves.png")
print("saved loss_curves.png")
