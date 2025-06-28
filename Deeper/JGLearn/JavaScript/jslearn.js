// Enhanced interactive JS learning app with topics, quizzes, and practice challenges

// Topics contain lessons, quizzes, and practice challenges
const topics = [
    {
        id: "variables-data-types",
        title: "Variables & Data Types",
        description: "Learn about variables and the different data types in JavaScript.",
        lessons: [
            {
                title: "Variables & Data Types",
                text: `In JavaScript, you store values in <span class="keyword">variables</span> using the keywords <span class="keyword">let</span>, <span class="keyword">const</span>, or <span class="keyword">var</span>.<br><br>
                <div class="critical">Variables created with <span class="keyword">const</span> cannot be reassigned!</div>
                JavaScript has several data types:<br>
                • <span class="highlight">Strings</span>: Text values like <span class="string">"Hello"</span><br>
                • <span class="highlight">Numbers</span>: Like <span class="number">42</span> or <span class="number">3.14</span><br>
                • <span class="highlight">Booleans</span>: <span class="keyword">true</span> or <span class="keyword">false</span><br><br>
                
                <strong>Task:</strong> Create a variable called <span class="highlight">myName</span> using <span class="keyword">const</span> and set it to your name. Then use <span class="function">console.log()</span> to print it.`,
                starter: "// Create your variable here\n\n// Print your variable",
                hint: "Try this: const myName = \"Your Name\";\nconsole.log(myName);",
                test: (output) => output.trim() !== '' && !output.includes('undefined'),
                success: "Great! You've created and printed a variable.",
                relatedLinks: [
                    { text: "MDN: JavaScript Variables", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Declarations" },
                    { text: "MDN: Data Types and Structures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures" }
                ]
            }
        ],
        quizzes: [
            {
                question: "Which keyword creates a variable that <strong>cannot</strong> be reassigned?",
                options: [
                    "let",
                    "var",
                    "const",
                    "function"
                ],
                correctIndex: 2,
                explanation: "The <code>const</code> keyword creates a constant whose value cannot be reassigned. Once you declare <code>const x = 5;</code>, you cannot change x to a different value."
            },
            {
                question: "What will <code>console.log(typeof \"42\")</code> output?",
                options: [
                    "number",
                    "string",
                    "boolean",
                    "undefined"
                ],
                correctIndex: 1,
                explanation: "When a number is enclosed in quotes like \"42\", it becomes a string. The <code>typeof</code> operator returns the data type of a value."
            }
        ],
        practice: {
            title: "Working with Variables",
            description: "Complete the code to create and manipulate variables correctly:",
            codeStart: "// Create a string variable named greeting\n",
            codeMid: "",
            codeEnd: "\n\n// Create a number variable named score with value 10\nlet score = 10;\n\n// Increase score by 5\nscore += 5;\n\n// Print both variables\nconsole.log(greeting);\nconsole.log(score);",
            solution: "const greeting = \"Hello, JavaScript!\";",
            test: (output) => {
                return output.includes("Hello") && output.includes("15");
            },
            feedback: "Your solution should create a string variable 'greeting' with a welcome message."
        }
    },
    {
        id: "operators",
        title: "Operators",
        description: "Learn about arithmetic, comparison, and logical operators in JavaScript.",
        lessons: [
            {
                title: "Operators",
                text: `JavaScript has various <span class="highlight">operators</span> for manipulating values:<br><br>
                <strong>Arithmetic operators:</strong><br>
                • Addition: <span class="number">5</span> <span class="keyword">+</span> <span class="number">3</span><br>
                • Subtraction: <span class="number">10</span> <span class="keyword">-</span> <span class="number">4</span><br>
                • Multiplication: <span class="number">3</span> <span class="keyword">*</span> <span class="number">7</span><br>
                • Division: <span class="number">20</span> <span class="keyword">/</span> <span class="number">5</span><br><br>
                
                <div class="critical">Be careful with division by zero!</div>
                
                <strong>Task:</strong> Create variables for <span class="highlight">width</span> and <span class="highlight">height</span> (any numbers), then calculate and print their <span class="highlight">area</span> (width * height).`,
                starter: "// Create width and height variables\n\n// Calculate area\n\n// Print the result",
                hint: "Try this:\nconst width = 10;\nconst height = 5;\nconst area = width * height;\nconsole.log(area);",
                test: (output) => !isNaN(parseInt(output)) && parseInt(output) > 0,
                success: "Excellent work! You've used arithmetic operators to calculate an area.",
                relatedLinks: [
                    { text: "MDN: Expressions and Operators", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_Operators" }
                ]
            }
        ],
        quizzes: [
            {
                question: "What is the result of <code>5 + 5 + \"5\"</code>?",
                options: [
                    "555",
                    "15",
                    "\"105\"",
                    "\"55\""
                ],
                correctIndex: 1,
                explanation: "JavaScript evaluates from left to right. First, 5 + 5 equals 10, then 10 is concatenated with the string \"5\" to produce \"105\"."
            },
            {
                question: "Which operator is used for checking both value and type equality?",
                options: [
                    "==",
                    "===",
                    "=",
                    "!="
                ],
                correctIndex: 1,
                explanation: "The strict equality operator (===) checks both value and type. For example, 5 === \"5\" is false because one is a number and one is a string."
            }
        ],
        practice: {
            title: "Calculate Discount",
            description: "Complete the code to calculate a discount:",
            codeStart: "// Original price and discount percentage\nconst price = 100;\nconst discountPercent = 20;\n\n// Calculate discount amount\n",
            codeMid: "",
            codeEnd: "\n\n// Calculate final price\nconst finalPrice = price - discountAmount;\n\n// Print both amounts\nconsole.log(\"Discount amount: $\" + discountAmount);\nconsole.log(\"Final price: $\" + finalPrice);",
            solution: "const discountAmount = (price * discountPercent) / 100;",
            test: (output) => {
                return output.includes("Discount amount: $20") && output.includes("Final price: $80");
            },
            feedback: "Your code should calculate the discount amount as a percentage of the price."
        }
    },
    {
        id: "functions",
        title: "Functions",
        description: "Learn how to create and use functions in JavaScript.",
        lessons: [
            {
                title: "Functions",
                text: `<span class="keyword">Functions</span> let you reuse code and organize your program into logical blocks.<br><br>
                You can create functions using:<br>
                • Function declarations: <span class="keyword">function</span> <span class="function">myFunction</span>() { ... }<br>
                • Arrow functions: <span class="keyword">const</span> <span class="function">myFunction</span> = () <span class="keyword">=></span> { ... }<br><br>
                
                <div class="critical">Don't forget to <span class="keyword">return</span> a value from your function!</div>
                
                <strong>Task:</strong> Write a function called <span class="function">greet</span> that takes a <span class="highlight">name</span> parameter and returns a greeting (e.g., "Hello, [name]!"). Call your function and print the result.`,
                starter: "// Write your function here\n\n// Call your function and print the result",
                hint: `function greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));`,
                test: (output) => output.includes('Hello') && output.includes('!'),
                success: "Fantastic! You've created a function with a parameter and called it successfully.",
                relatedLinks: [
                    { text: "MDN: Functions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions" },
                    { text: "MDN: Arrow Functions", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions" }
                ]
            }
        ],
        quizzes: [
            {
                question: "What's the difference between function declaration and function expression?",
                options: [
                    "There is no difference",
                    "Function declarations are hoisted, function expressions are not",
                    "Function expressions can have parameters, declarations cannot",
                    "Function declarations can only be called once"
                ],
                correctIndex: 1,
                explanation: "Function declarations (function foo(){}) are hoisted to the top of their scope, so you can call them before they are defined. Function expressions (const foo = function(){}) are not hoisted."
            },
            {
                question: "What will this function return? <code>function add(a, b) { a + b; }</code>",
                options: [
                    "The sum of a and b",
                    "undefined",
                    "null",
                    "An error"
                ],
                correctIndex: 1,
                explanation: "This function doesn't have a return statement, so it will return undefined. To fix it: function add(a, b) { return a + b; }"
            }
        ],
        practice: {
            title: "Create a Calculator Function",
            description: "Complete the multiply function that takes two parameters and returns their product:",
            codeStart: "// Complete the multiply function\nfunction multiply(a, b) {\n",
            codeMid: "",
            codeEnd: "}\n\n// Test cases\nconsole.log(multiply(3, 4)); // Should output: 12\nconsole.log(multiply(5, 5)); // Should output: 25",
            solution: "  return a * b;",
            test: (output) => {
                return output.includes("12") && output.includes("25");
            },
            feedback: "Your multiply function should return the product of its two parameters."
        }
    },
    {
        id: "conditionals",
        title: "Conditionals",
        description: "Learn about if/else statements and logical decisions.",
        lessons: [
            {
                title: "Conditionals",
                text: `<span class="keyword">Conditional statements</span> let your code make decisions based on conditions.<br><br>
                The main conditional structures are:<br>
                • <span class="keyword">if</span> (condition) { ... }<br>
                • <span class="keyword">if</span> (condition) { ... } <span class="keyword">else</span> { ... }<br>
                • <span class="keyword">if</span> (condition) { ... } <span class="keyword">else if</span> (condition) { ... } <span class="keyword">else</span> { ... }<br><br>
                
                <div class="critical">Remember to use <span class="keyword">===</span> for equality comparisons!</div>
                
                <strong>Task:</strong> Write code that checks if a number is positive, negative, or zero, and prints a descriptive message.`,
                starter: "const num = 7; // Change this to test different values\n\n// Write your conditional code here",
                hint: `const num = 7;\n\nif (num > 0) {\n  console.log("The number is positive");\n} else if (num < 0) {\n  console.log("The number is negative");\n} else {\n  console.log("The number is zero");\n}`,
                test: (output) => output.includes('positive') || output.includes('negative') || output.includes('zero'),
                success: "Great job! You've used conditional logic to determine the sign of a number.",
                relatedLinks: [
                    { text: "MDN: if...else", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else" },
                    { text: "MDN: Comparison operators", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators" }
                ]
            }
        ],
        quizzes: [
            {
                question: "Which of the following is NOT a valid condition in an if statement?",
                options: [
                    "if (x > 5)",
                    "if (x)",
                    "if (x = 5)",
                    "if (x === \"5\")"
                ],
                correctIndex: 2,
                explanation: "if (x = 5) is not a valid condition because it assigns 5 to x rather than comparing them. The correct comparison would be if (x === 5) or if (x == 5)."
            },
            {
                question: "What will this code output? <code>let x = 10; if (x > 5) { console.log(\"A\"); } else if (x > 8) { console.log(\"B\"); }</code>",
                options: [
                    "A",
                    "B",
                    "A and B",
                    "Nothing"
                ],
                correctIndex: 0,
                explanation: "This will output 'A'. Once the first condition (x > 5) is met, the rest of the else-if chain is skipped, even though (x > 8) is also true."
            }
        ],
        practice: {
            title: "Age Verification System",
            description: "Complete the code to implement age verification:",
            codeStart: "// Function to check if someone can access content\nfunction checkAccess(age) {\n",
            codeMid: "",
            codeEnd: "}\n\n// Test cases\nconsole.log(checkAccess(15)); // Should output: Access denied\nconsole.log(checkAccess(18)); // Should output: Access granted\nconsole.log(checkAccess(21)); // Should output: Access granted",
            solution: "  if (age >= 18) {\n    return \"Access granted\";\n  } else {\n    return \"Access denied\";\n  }",
            test: (output) => {
                return output.includes("Access denied") && output.includes("Access granted");
            },
            feedback: "Your function should return 'Access granted' for ages 18 and above, and 'Access denied' otherwise."
        }
    },
    {
        id: "arrays",
        title: "Arrays",
        description: "Learn about arrays for storing collections of data.",
        lessons: [
            {
                title: "Arrays",
                text: `<span class="keyword">Arrays</span> are ordered collections of items that can hold multiple values.<br><br>
                You create arrays using square brackets:<br>
                • <span class="keyword">const</span> fruits = [<span class="string">"apple"</span>, <span class="string">"banana"</span>, <span class="string">"orange"</span>];<br><br>
                
                Arrays have many useful methods like <span class="function">push()</span>, <span class="function">pop()</span>, <span class="function">slice()</span>, and <span class="function">forEach()</span>.<br><br>
                
                <div class="critical">Array indexes start at <span class="number">0</span>, not <span class="number">1</span>!</div>
                
                <strong>Task:</strong> Create an array of colors, add a new color to it using <span class="function">push()</span>, and then print the array and its length.`,
                starter: "// Create your array\n\n// Add a new color\n\n// Print the array and its length",
                hint: `const colors = ["red", "green", "blue"];\ncolors.push("yellow");\nconsole.log(colors);\nconsole.log("Length:", colors.length);`,
                test: (output) => output.includes('[') && output.includes(']') && output.includes('Length'),
                success: "Excellent! You've created an array, modified it, and accessed its properties.",
                relatedLinks: [
                    { text: "MDN: Arrays", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array" },
                    { text: "MDN: Array methods", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#Instance_methods" }
                ]
            }
        ],
        quizzes: [
            {
                question: "Which method adds an element to the end of an array?",
                options: [
                    "array.pop()",
                    "array.push()",
                    "array.shift()",
                    "array.unshift()"
                ],
                correctIndex: 1,
                explanation: "array.push() adds an element to the end of an array. For example: let arr = [1,2]; arr.push(3); results in [1,2,3]."
            },
            {
                question: "How do you access the third element of an array called 'pets'?",
                options: [
                    "pets[3]",
                    "pets[2]",
                    "pets.3",
                    "pets.get(3)"
                ],
                correctIndex: 1,
                explanation: "Array indexes start at 0, so the third element is at index 2. The correct way to access it is pets[2]."
            }
        ],
        practice: {
            title: "Array Manipulation",
            description: "Complete the code to find the average score:",
            codeStart: "// Array of test scores\nconst scores = [85, 90, 78, 92, 86];\n\n// Calculate the sum of all scores\n",
            codeMid: "",
            codeEnd: "\n\n// Calculate the average (sum divided by number of scores)\nconst average = sum / scores.length;\n\n// Print the average\nconsole.log(\"The average score is: \" + average);",
            solution: "let sum = 0;\nfor (let i = 0; i < scores.length; i++) {\n  sum += scores[i];\n}",
            test: (output) => {
                return output.includes("The average score is: 86.2");
            },
            feedback: "Your code should calculate the sum of all scores in the array, which you can do using a loop."
        }
    }
];

// Application state
let state = {
    currentTopicIndex: 0,     // Index of current topic
    currentLessonIndex: 0,    // Index of current lesson within a topic
    currentMode: "learn",     // Current view mode: "learn", "quiz", or "practice"
    currentQuizIndex: 0,      // Index of current quiz within a topic
    selectedOption: null,     // Selected quiz option
    quizCompleted: false,     // Whether the current quiz is completed
    progress: {}              // User progress, stored as { topicId: { completed: bool, lessonIndex: number, quizIndex: number } }
};

// Load saved progress from localStorage
function loadProgress() {
    try {
        const savedProgress = localStorage.getItem('jsLearnProgress');
        if (savedProgress) {
            state.progress = JSON.parse(savedProgress);
        }
    } catch (e) {
        console.warn("Could not load saved progress", e);
        state.progress = {};
    }
}

// Save progress to localStorage
function saveProgress() {
    try {
        localStorage.setItem('jsLearnProgress', JSON.stringify(state.progress));
    } catch (e) {
        console.warn("Could not save progress", e);
    }
}

// Get progress for current topic
function getTopicProgress(topicId) {
    if (!state.progress[topicId]) {
        state.progress[topicId] = { 
            completed: false, 
            lessonIndex: 0, 
            quizIndex: 0,
            modeCompleted: { learn: false, quiz: false, practice: false }
        };
    }
    return state.progress[topicId];
}

// Initialize UI when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    populateTopicSidebar();
    setupEventListeners();
    showTopic(state.currentTopicIndex);
    updateProgressBar();
    checkDeviceSize();
});

// Set up all the event listeners
function setupEventListeners() {
    // Run button for learn mode
    document.getElementById('run-btn').addEventListener('click', runCode);
    
    // Mode selector buttons
    document.querySelectorAll('.view-mode-btn').forEach(button => {
        button.addEventListener('click', () => {
            switchMode(button.dataset.mode);
        });
    });
    
    // Navigation buttons
    document.getElementById('next-btn').addEventListener('click', () => {
        const currentTopic = topics[state.currentTopicIndex];
        const topicProgress = getTopicProgress(currentTopic.id);
        
        if (state.currentMode === "learn" && state.currentLessonIndex < currentTopic.lessons.length - 1) {
            state.currentLessonIndex++;
            topicProgress.lessonIndex = state.currentLessonIndex;
            saveProgress();
            showLesson(state.currentLessonIndex);
            updateProgressBar();
        } else if (state.currentMode === "quiz") {
            goToNextQuiz();
        }
    });
    
    document.getElementById('back-btn').addEventListener('click', () => {
        if (state.currentMode === "learn" && state.currentLessonIndex > 0) {
            state.currentLessonIndex--;
            showLesson(state.currentLessonIndex);
            updateProgressBar();
        } else if (state.currentMode === "quiz" && state.currentQuizIndex > 0) {
            state.currentQuizIndex--;
            showQuiz();
        }
    });
    
    // Hint button
    document.getElementById('hint-btn').addEventListener('click', showHint);
    
    // Quiz buttons
    document.getElementById('check-answer-btn').addEventListener('click', checkQuizAnswer);
    document.getElementById('next-quiz-btn').addEventListener('click', goToNextQuiz);
    
    // Practice buttons
    document.getElementById('run-practice-btn').addEventListener('click', runPractice);
    document.getElementById('reset-practice-btn').addEventListener('click', resetPractice);
    
    // Modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Completion modal next topic button
    document.getElementById('next-topic-btn').addEventListener('click', () => {
        document.getElementById('completion-modal').style.display = 'none';
        if (state.currentTopicIndex < topics.length - 1) {
            state.currentTopicIndex++;
            showTopic(state.currentTopicIndex);
        }
    });
    
    // Sidebar toggle (for mobile)
    document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
    
    // Window resize event
    window.addEventListener('resize', checkDeviceSize);
}

// Populate the topic sidebar
function populateTopicSidebar() {
    const topicList = document.getElementById('topic-list');
    topicList.innerHTML = '';
    
    topics.forEach((topic, index) => {
        const topicProgress = getTopicProgress(topic.id);
        const isCompleted = topicProgress.completed;
        
        const li = document.createElement('li');
        li.className = `topic-item ${index === state.currentTopicIndex ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
        li.textContent = topic.title;
        li.dataset.index = index;
        
        // Add progress indicator if not completed
        if (!isCompleted) {
            const totalSteps = 3; // learn, quiz, practice
            const completedSteps = Object.values(topicProgress.modeCompleted).filter(Boolean).length;
            const progressPercent = (completedSteps / totalSteps) * 100;
            
            const progressIndicator = document.createElement('div');
            progressIndicator.className = 'progress-indicator';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = `${progressPercent}%`;
            
            progressIndicator.appendChild(progressBar);
            li.appendChild(progressIndicator);
        }
        
        li.addEventListener('click', () => {
            document.querySelectorAll('.topic-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            showTopic(index);
        });
        
        topicList.appendChild(li);
    });
}

// Show a topic by index
function showTopic(index) {
    if (index >= 0 && index < topics.length) {
        state.currentTopicIndex = index;
        const topic = topics[index];
        const topicProgress = getTopicProgress(topic.id);
        
        // Set current lesson index from progress
        state.currentLessonIndex = topicProgress.lessonIndex || 0;
        state.currentQuizIndex = topicProgress.quizIndex || 0;
        
        // Update UI for current topic
        updateModeButtons(topicProgress);
        switchMode(state.currentMode);
        updateProgressBar();
        
        // Update sidebar
        document.querySelectorAll('.topic-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
    }
}

// Update the mode buttons based on completion status
function updateModeButtons(topicProgress) {
    const modeButtons = document.querySelectorAll('.view-mode-btn');
    
    modeButtons.forEach(button => {
        const mode = button.dataset.mode;
        const isCompleted = topicProgress.modeCompleted && topicProgress.modeCompleted[mode];
        
        // Remove existing completion marker if any
        const marker = button.querySelector('.completion-marker');
        if (marker) marker.remove();
        
        // Add completion marker if completed
        if (isCompleted) {
            const completionMarker = document.createElement('span');
            completionMarker.className = 'completion-marker';
            completionMarker.innerHTML = ' ✓';
            completionMarker.style.color = '#22c55e';
            button.appendChild(completionMarker);
        }
    });
}

// Switch between learn, quiz, and practice modes
function switchMode(mode) {
    state.currentMode = mode;
    
    // Update mode selector
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show the appropriate container
    document.querySelectorAll('.mode-container').forEach(container => {
        container.classList.remove('active-mode');
    });
    document.getElementById(`${mode}-mode`).classList.add('active-mode');
    
    // Load appropriate content based on mode
    switch (mode) {
        case "learn":
            showLesson(state.currentLessonIndex);
            break;
        case "quiz":
            showQuiz();
            break;
        case "practice":
            showPractice();
            break;
    }
    
    // Update next/previous buttons
    updateNavigationButtons();
}

// Show a lesson by index
function showLesson(idx) {
    const currentTopic = topics[state.currentTopicIndex];
    if (idx >= 0 && idx < currentTopic.lessons.length) {
        state.currentLessonIndex = idx;
        const lesson = currentTopic.lessons[idx];
        
        // Update lesson content
        document.getElementById('lesson-title').innerHTML = `<h2>${lesson.title}</h2>`;
        document.getElementById('lesson-text').innerHTML = lesson.text;
        document.getElementById('code-editor').value = lesson.starter;
        document.getElementById('output').textContent = '';
        
        // Update navigation buttons
        updateNavigationButtons();
        
        // Add related links if available
        updateRelatedLinks(lesson);
    }
}

// Show the current quiz
function showQuiz() {
    const currentTopic = topics[state.currentTopicIndex];
    if (currentTopic.quizzes && currentTopic.quizzes.length > 0) {
        const quiz = currentTopic.quizzes[state.currentQuizIndex];
        
        // Reset quiz state
        state.selectedOption = null;
        state.quizCompleted = false;
        
        // Update quiz content
        document.getElementById('quiz-title').textContent = `Quiz: ${currentTopic.title}`;
        document.getElementById('quiz-question').innerHTML = `${state.currentQuizIndex + 1}. ${quiz.question}`;
        
        // Create quiz options
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        quiz.options.forEach((option, i) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.innerHTML = option;
            optionDiv.dataset.index = i;
            
            optionDiv.addEventListener('click', () => {
                if (state.quizCompleted) return; // Don't allow changing after checking
                
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionDiv.classList.add('selected');
                state.selectedOption = i;
            });
            
            optionsContainer.appendChild(optionDiv);
        });
        
        // Reset feedback and buttons
        document.getElementById('quiz-feedback').textContent = '';
        document.getElementById('quiz-feedback').className = 'feedback';
        document.getElementById('check-answer-btn').style.display = 'block';
        document.getElementById('next-quiz-btn').style.display = 'none';
        
        updateNavigationButtons();
    }
}

// Check the answer for the current quiz
function checkQuizAnswer() {
    const currentTopic = topics[state.currentTopicIndex];
    if (state.selectedOption === null || state.quizCompleted) return;
    
    const quiz = currentTopic.quizzes[state.currentQuizIndex];
    const isCorrect = state.selectedOption === quiz.correctIndex;
    const feedback = document.getElementById('quiz-feedback');
    
    // Mark option as correct/incorrect
    document.querySelectorAll('.quiz-option').forEach((option, i) => {
        if (i === quiz.correctIndex) {
            option.classList.add('correct');
        } else if (i === state.selectedOption) {
            option.classList.add('incorrect');
        }
    });
    
    // Show feedback
    feedback.className = `feedback ${isCorrect ? 'success' : 'error'}`;
    feedback.innerHTML = isCorrect 
        ? `<strong>Correct!</strong> ${quiz.explanation}`
        : `<strong>Not quite.</strong> ${quiz.explanation}`;
    feedback.style.display = 'block';
    
    // Update UI state
    state.quizCompleted = true;
    document.getElementById('check-answer-btn').style.display = 'none';
    
    // Show next button if there are more quizzes, or if all are completed
    const hasMoreQuizzes = state.currentQuizIndex < currentTopic.quizzes.length - 1;
    document.getElementById('next-quiz-btn').style.display = 'block';
    
    // Update progress
    if (isCorrect && !hasMoreQuizzes) {
        const topicProgress = getTopicProgress(currentTopic.id);
        topicProgress.modeCompleted.quiz = true;
        saveProgress();
        updateModeButtons(topicProgress);
    }
}

// Go to the next quiz question
function goToNextQuiz() {
    const currentTopic = topics[state.currentTopicIndex];
    
    if (state.currentQuizIndex < currentTopic.quizzes.length - 1) {
        state.currentQuizIndex++;
        const topicProgress = getTopicProgress(currentTopic.id);
        topicProgress.quizIndex = state.currentQuizIndex;
        saveProgress();
        showQuiz();
    } else {
        // All quizzes completed for this topic
        const topicProgress = getTopicProgress(currentTopic.id);
        topicProgress.modeCompleted.quiz = true;
        saveProgress();
        
        // Check if all modes are completed
        checkTopicCompletion();
    }
}

// Show the practice challenge
function showPractice() {
    const currentTopic = topics[state.currentTopicIndex];
    
    if (currentTopic.practice) {
        const practice = currentTopic.practice;
        
        document.getElementById('practice-title').textContent = practice.title;
        document.getElementById('practice-description').innerHTML = practice.description;
        document.getElementById('practice-code-start').innerHTML = practice.codeStart;
        document.getElementById('practice-code-middle').value = practice.codeMid || '';
        document.getElementById('practice-code-end').innerHTML = practice.codeEnd;
        document.getElementById('practice-output').textContent = '';
        document.getElementById('practice-feedback').className = 'feedback';
        document.getElementById('practice-feedback').textContent = '';
        
        updateNavigationButtons();
    }
}

// Run and verify the practice code
function runPractice() {
    const currentTopic = topics[state.currentTopicIndex];
    if (!currentTopic.practice) return;
    
    const practice = currentTopic.practice;
    const userCode = document.getElementById('practice-code-middle').value;
    const fullCode = practice.codeStart + userCode + practice.codeEnd;
    
    let output = '';
    const originalLog = console.log;
    
    console.log = function(...args) {
        output += args.join(' ') + '\n';
    };
    
    try {
        eval(fullCode);
        document.getElementById('practice-output').textContent = output;
        
        // Test the output
        const passed = practice.test(output);
        const feedback = document.getElementById('practice-feedback');
        
        if (passed) {
            feedback.className = 'feedback success';
            feedback.innerHTML = `<strong>Great job!</strong> Your solution works correctly!`;
            
            // Mark practice as completed
            const topicProgress = getTopicProgress(currentTopic.id);
            topicProgress.modeCompleted.practice = true;
            saveProgress();
            updateModeButtons(topicProgress);
            
            // Check if all modes are completed
            checkTopicCompletion();
        } else {
            feedback.className = 'feedback error';
            feedback.innerHTML = `<strong>Not quite right.</strong> ${practice.feedback}`;
        }
    } catch (e) {
        document.getElementById('practice-output').textContent = `Error: ${e.message}`;
        document.getElementById('practice-feedback').className = 'feedback error';
        document.getElementById('practice-feedback').innerHTML = `<strong>Error:</strong> There's a problem with your code. Check for syntax errors.`;
    }
    
    // Restore console.log
    console.log = originalLog;
}

// Reset the practice code
function resetPractice() {
    const currentTopic = topics[state.currentTopicIndex];
    if (currentTopic.practice) {
        document.getElementById('practice-code-middle').value = currentTopic.practice.codeMid || '';
        document.getElementById('practice-output').textContent = '';
        document.getElementById('practice-feedback').className = 'feedback';
        document.getElementById('practice-feedback').textContent = '';
    }
}

// Check if a topic is completely finished
function checkTopicCompletion() {
    const currentTopic = topics[state.currentTopicIndex];
    const topicProgress = getTopicProgress(currentTopic.id);
    
    const allModesCompleted = 
        topicProgress.modeCompleted.learn && 
        topicProgress.modeCompleted.quiz && 
        topicProgress.modeCompleted.practice;
    
    if (allModesCompleted && !topicProgress.completed) {
        topicProgress.completed = true;
        saveProgress();
        
        // Show completion modal
        const completionMessage = document.getElementById('completion-message');
        completionMessage.innerHTML = `<p>Congratulations! You've completed the <strong>${currentTopic.title}</strong> topic.</p>`;
        
        if (state.currentTopicIndex < topics.length - 1) {
            completionMessage.innerHTML += `<p>Ready to move on to <strong>${topics[state.currentTopicIndex + 1].title}</strong>?</p>`;
            document.getElementById('next-topic-btn').style.display = 'block';
        } else {
            completionMessage.innerHTML += `<p>You've completed all available topics! Great job!</p>`;
            document.getElementById('next-topic-btn').style.display = 'none';
        }
        
        document.getElementById('completion-modal').style.display = 'block';
        
        // Update sidebar to show completion
        populateTopicSidebar();
    }
}

// Update the navigation buttons based on current state
function updateNavigationButtons() {
    const currentTopic = topics[state.currentTopicIndex];
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (state.currentMode === "learn") {
        backBtn.disabled = state.currentLessonIndex === 0;
        nextBtn.style.display = 'none'; // Next is shown only after completing the exercise
    } else if (state.currentMode === "quiz") {
        backBtn.disabled = state.currentQuizIndex === 0;
        nextBtn.style.display = 'none'; // Next quiz button is shown after checking answer
    } else if (state.currentMode === "practice") {
        backBtn.disabled = true; // No navigation in practice mode
        nextBtn.style.display = 'none';
    }
}

// Update the progress bar
function updateProgressBar() {
    let totalTopics = topics.length;
    let completedTopics = 0;
    
    // Count completed topics
    topics.forEach(topic => {
        const progress = state.progress[topic.id];
        if (progress && progress.completed) {
            completedTopics++;
        }
    });
    
    // Add partial completion for current topic
    const currentTopic = topics[state.currentTopicIndex];
    const currentProgress = state.progress[currentTopic.id];
    
    if (currentProgress && !currentProgress.completed) {
        const completedModes = Object.values(currentProgress.modeCompleted).filter(Boolean).length;
        const totalModes = 3; // learn, quiz, practice
        completedTopics += completedModes / totalModes / totalTopics;
    }
    
    const progressPercentage = (completedTopics / totalTopics) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
}

// Add related links to the lesson section
function updateRelatedLinks(lesson) {
    const relatedLinksSection = document.querySelector('.related-links');
    if (relatedLinksSection) {
        relatedLinksSection.remove();
    }
    
    if (lesson.relatedLinks && lesson.relatedLinks.length > 0) {
        const relatedLinks = document.createElement('div');
        relatedLinks.className = 'related-links';
        
        const heading = document.createElement('h3');
        heading.textContent = 'Related Resources:';
        relatedLinks.appendChild(heading);
        
        const list = document.createElement('ul');
        lesson.relatedLinks.forEach(link => {
            const item = document.createElement('li');
            const anchor = document.createElement('a');
            anchor.href = link.url;
            anchor.textContent = link.text;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            item.appendChild(anchor);
            list.appendChild(item);
        });
        
        relatedLinks.appendChild(list);
        document.getElementById('lesson-section').appendChild(relatedLinks);
    }
}

// Show hint for the current lesson
function showHint() {
    const currentTopic = topics[state.currentTopicIndex];
    const lesson = currentTopic.lessons[state.currentLessonIndex];
    
    document.getElementById('hint-text').innerHTML = `<pre><code class="language-javascript">${lesson.hint}</code></pre>`;
    document.getElementById('hint-modal').style.display = 'block';
    
    // Highlight code in hint
    if (window.Prism) {
        Prism.highlightAll();
    }
}

// Run the code in the learn mode editor
function runCode() {
    const currentTopic = topics[state.currentTopicIndex];
    const lesson = currentTopic.lessons[state.currentLessonIndex];
    const code = document.getElementById('code-editor').value;
    
    let output = '';
    const originalLog = console.log;
    
    console.log = function(...args) {
        output += args.join(' ') + '\n';
    };
    
    try {
        // Run the code
        eval(code);
        document.getElementById('output').textContent = output;
        
        // Check if lesson is completed successfully
        if (lesson.test(output)) {
            document.getElementById('output').textContent += '\n' + lesson.success;
            document.getElementById('next-btn').style.display = (state.currentLessonIndex < currentTopic.lessons.length - 1) ? 'inline-block' : 'none';
            
            // Mark as completed if this is the last lesson
            if (state.currentLessonIndex === currentTopic.lessons.length - 1) {
                const topicProgress = getTopicProgress(currentTopic.id);
                topicProgress.modeCompleted.learn = true;
                saveProgress();
                updateModeButtons(topicProgress);
            }
        }
    } catch (e) {
        document.getElementById('output').textContent = 'Error: ' + e.message;
    }
    
    // Restore console.log
    console.log = originalLog;
}

// Toggle sidebar for mobile view
function toggleSidebar() {
    document.body.classList.toggle('sidebar-collapsed');
}

// Check device size and adjust UI accordingly
function checkDeviceSize() {
    if (window.innerWidth <= 900) {
        document.body.classList.add('sidebar-collapsed');
    } else {
        document.body.classList.remove('sidebar-collapsed');
    }
}