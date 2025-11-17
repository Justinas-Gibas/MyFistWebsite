#include <stdio.h>
#include <ctype.h>
#include <string.h>

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <text>\n", argv[0]);
        return 1;
    }

    char buffer[256];
    strncpy(buffer, argv[1], sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';

    int letters = 0;
    for (size_t i = 0; buffer[i] != '\0'; ++i) {
        if (isalpha((unsigned char)buffer[i])) {
            buffer[i] = (char)toupper((unsigned char)buffer[i]);
            letters++;
        }
    }

    printf("Upper: %s\n", buffer);
    printf("Letters: %d\n", letters);
    return 0;
}
