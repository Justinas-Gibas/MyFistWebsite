#include <iostream>
#include <cctype>
#include <string>

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "Usage: " << argv[0] << " <text>\n";
        return 1;
    }

    std::string text = argv[1];
    int letters = 0;
    for (char& ch : text) {
        if (std::isalpha(static_cast<unsigned char>(ch))) {
            ch = static_cast<char>(std::toupper(static_cast<unsigned char>(ch)));
            ++letters;
        }
    }

    std::cout << "Upper: " << text << "\n";
    std::cout << "Letters: " << letters << "\n";
    return 0;
}
