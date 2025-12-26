Important: Throughout this program, you will need to use certain LLM APIs to complete Hands-on projects, Labs, and Sprint projects. If your learning is funded by the German Government (Agentur für Arbeit), please refer to this guide to learn how to get access to these resources before moving on.

The goal of this hands-on exercise will differ from that of the first one. Instead of focusing on more complex logic, you will be figuring out how to implement a slightly more complex library. You will likely be surprised at how powerful the programs you write can be once you start using external packages!

Task description
Are you annoyed that ChatGPT works slowly sometimes? Or that it is occasionally non-reachable completely? It turns out that you already know enough concepts to build a program that interacts with OpenAI's Chat API and to avoid all of those issues! Your task will be to create a program that will allow you to chat with ChatGPT via your terminal using OpenAI's Chat Completion API.

The exact task requirements are as follows:

Your program should accept two arguments when it is run: an API key and a name for the ChatBot. E.g. you should run it using: python gptbot <API_key> Bobby
For a slight challenge, you can also use a system variable to securely pass in the API key, even though you have not learned about these yet.

You should get into the habit of never adding sensitive information directly into your main code files. It is surprising how often developers accidentally cause major security breaches by simply having sensitive information, like passwords or API keys, in the files they upload publicly, e.g., into Git repositories.

The program, when started, should prompt the user for the first message.
When the user presses Enter, the program should get a response from GPT and print out the response message, starting it with AI:
The user should then be able to continue the conversation (instead of starting it repeatedly with each input). This means you will send an ever longer message history to the API.
The ChatBot should identify itself with the name you provided
The program should end when you press ctrl+d (cmd+d on Mac) by printing out "Bye!" and the total amount of tokens used in the conversation.
The program should also end if the conversation becomes too long for the API.
Your program should use the openai package and the ChatCompletion API. You can use the "gpt-4.1-nano" or a more powerful/recent one if it is available.
Your program should use at least one try/except statement
Your program should have at least three unit tests that can be run using pytest test
Hint:

(If you feel confident, try to solve the task without looking at the following)

You will need to accomplish the following steps:

Find the documentation for the OpenAI's Chat Completion API and, most likely, some examples for sending simple API requests with Python
Make sure you have an OpenAI account
Get an API key and an Organization ID for a personal account
Make your program accept the API key as a command line argument
(optional) Make the API key accessible via a system variable
Install the required library via the terminal
Test that you can send the most basic request and receive a response (note: even though you have learned to use the requests module, it is not always required to make requests!)
Enable continuation of the conversation
Make the AI respond to the name passed as an argument.
Keep a count of how many tokens have been
Write a couple of unit tests, ensuring that they are simple. If it seems impossible, you may need to split your functions a bit so that you have simpler ones that you can test.
Handle exiting the program
Double check that you have used at least one try/except statement
Bonus challenge
Create a program that makes chatGPT talk to itself. It should have two different personalities, one called Alice and one called Bob. Both of them should have a different temperature setting.

The user should click "enter" without input if they want the next conversation step to happen.

The user should also be able to type "topic: {description of a topic}". In its following message, this should cause the AI to try to switch the topic to what the user has described. It is possible that this will not work entirely reliably, but if you are curious about GPT, you can experiment with how to make it happen more consistently.

Suppose the user enters anything other than the "topic: {description}" format. In that case, they should be informed that this is an invalid input and asked to either enter it correctly or not enter any input at all.

Approach to solving the task
You are once again advised to take a similar approach as in the previous hands-on exercise:

1-2 hours of attempting to solve the task on your own
If you see you are making no progress during the first 1-2 hours and the task seems much too complicated for you – we recommend 10 more hours working on the problem with help from peers and JTLs. Out of these 10 hours, you are expected to spend about half of them working with someone else – whether it is peer study buddies, peers who have completed the exercise and want to help you, or JTLs in open sessions.
If you still can't solve it, check the suggested solution and spend as much time as needed (also based on what you have available until the next deadline) to understand it.