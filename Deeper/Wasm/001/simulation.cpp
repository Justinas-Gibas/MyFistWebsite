#include <emscripten/emscripten.h>

int num_atoms = 1; // Single atom setup
float electron_positions[1];  // Array to hold the position of one electron

extern "C" {
    // Initialize the single atom (set the initial electron position)
    void EMSCRIPTEN_KEEPALIVE initialize_atoms() {
        electron_positions[0] = 0.0f;  // Set initial position of the electron to 0
    }

    // Update the electron position based on current flow
    void EMSCRIPTEN_KEEPALIVE update_electrons(float current_flow) {
        // Move the electron by current flow (scaled for smooth movement)
        electron_positions[0] += current_flow * 0.01f;

        // Bound the electron movement between 0 and 1 (loop around the atom)
        if (electron_positions[0] > 1.0f) {
            electron_positions[0] = 0.0f;  // Reset position when it reaches beyond bounds
        }
    }

    // Return the updated electron positions (pointer for JS to read)
    float* EMSCRIPTEN_KEEPALIVE get_electron_positions() {
        return electron_positions;
    }
}
