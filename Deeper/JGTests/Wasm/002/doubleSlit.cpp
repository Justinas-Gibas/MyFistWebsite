#include <math.h>
#include <emscripten/emscripten.h>

extern "C" {
    // Keep this function alive
    EMSCRIPTEN_KEEPALIVE
    float calculate_wave(float position, float time) {
        return sin(position - time);
    }
}
