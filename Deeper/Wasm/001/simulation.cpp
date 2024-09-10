#include <emscripten/emscripten.h>

int num_atoms = 10;
float electron_positions[10];  // Array to hold the positions of electrons

extern "C" {
    void EMSCRIPTEN_KEEPALIVE initialize_atoms() {
        for (int i = 0; i < num_atoms; i++) {
            electron_positions[i] = i * 1.0f;  // Set initial positions of electrons
        }
    }

    void EMSCRIPTEN_KEEPALIVE update_electrons(float current_flow) {
        for (int i = 0; i < num_atoms; i++) {
            electron_positions[i] += current_flow * 0.01f;
            if (electron_positions[i] > num_atoms) {
                electron_positions[i] = 0.0f;  // Loop electrons around
            }
        }
    }

    float* EMSCRIPTEN_KEEPALIVE get_electron_positions() {
        return electron_positions;
    }
}
