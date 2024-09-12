#include <vector>
#include <cmath>

// Function to displace vertex positions based on a sine wave
extern "C" {
    void displace_vertices(float* vertices, int count, float amplitude, float frequency) {
        for (int i = 0; i < count; i += 3) {
            float x = vertices[i];
            float y = vertices[i + 1];
            vertices[i + 2] = sin((x + y) * frequency) * amplitude; // Apply sine wave on Z-axis
        }
    }
}
