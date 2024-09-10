#include <emscripten/emscripten.h>
#include <math.h>

float electron_position[3];  // 3D position of the electron

extern "C" {
    void EMSCRIPTEN_KEEPALIVE initialize_electron() {
        electron_position[0] = 0.0f;  // x
        electron_position[1] = 0.0f;  // y
        electron_position[2] = 0.0f;  // z
    }

    void EMSCRIPTEN_KEEPALIVE collapse_wavefunction(float x, float y, float z) {
        electron_position[0] = x;
        electron_position[1] = y;
        electron_position[2] = z;
    }

    float* EMSCRIPTEN_KEEPALIVE get_electron_position() {
        return electron_position;
    }
}
