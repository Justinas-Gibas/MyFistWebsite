#!/usr/bin/env python3
"""
CLI ChatBot - A terminal-based chatbot using OpenAI's Chat Completion API.

Usage: python chatbot.py <API_key> <BotName>
Example: python chatbot.py sk-xxxxx Albert
"""

import sys
import os
from openai import OpenAI


def get_api_key_and_name():
    """Get API key and bot name from command line arguments or environment."""
    if len(sys.argv) >= 3:
        api_key = sys.argv[1]
        bot_name = sys.argv[2]
    elif len(sys.argv) == 2:
        # Try to get API key from environment variable
        api_key = os.environ.get("OPENAI_API_KEY")
        bot_name = sys.argv[1]
        if not api_key:
            print("Error: API key not provided. Pass it as first argument or set OPENAI_API_KEY environment variable.")
            sys.exit(1)
    else:
        print("Usage: python chatbot.py <API_key> <BotName>")
        print("   or: python chatbot.py <BotName> (with OPENAI_API_KEY environment variable set)")
        sys.exit(1)
    
    return api_key, bot_name


def create_system_message(bot_name):
    """Create the system message for the chatbot."""
    return {
        "role": "system",
        "content": f"You are a helpful assistant named {bot_name}. When asked about your name, you should identify yourself as {bot_name}."
    }


def format_user_message(content):
    """Format a user message for the API."""
    return {"role": "user", "content": content}


def format_assistant_message(content):
    """Format an assistant message for the API."""
    return {"role": "assistant", "content": content}


def get_chat_response(client, messages, model="gpt-4.1-nano"):
    """Send messages to the API and get a response."""
    response = client.chat.completions.create(
        model=model,
        messages=messages
    )
    return response


def extract_message_content(response):
    """Extract the message content from an API response."""
    return response.choices[0].message.content


def extract_token_usage(response):
    """Extract total tokens used from an API response."""
    return response.usage.total_tokens


def main():
    """Main function to run the chatbot."""
    api_key, bot_name = get_api_key_and_name()
    
    try:
        client = OpenAI(api_key=api_key)
    except Exception as e:
        print(f"Error initializing OpenAI client: {e}")
        sys.exit(1)
    
    messages = [create_system_message(bot_name)]
    total_tokens = 0
    
    print(f"Chatting as {bot_name}. Press Ctrl+D (Ctrl+Z or Ctrl+C on Windows) or type 'exit' to exit.")
    
    while True:
        try:
            user_input = input("You: ")
            
            # Allow user to exit by typing 'exit'
            if user_input.lower() == 'exit':
                print(f"Bye! Total tokens used: {total_tokens}")
                break
            
            # Add user message to history
            messages.append(format_user_message(user_input))
            
            try:
                # Get response from API
                response = get_chat_response(client, messages)
                
                # Extract and display the response
                assistant_message = extract_message_content(response)
                print(f"AI: {assistant_message}")
                
                # Add assistant response to history
                messages.append(format_assistant_message(assistant_message))
                
                # Update token count
                total_tokens += extract_token_usage(response)
                
            except Exception as e:
                error_str = str(e).lower()
                if "context_length_exceeded" in error_str or "maximum context length" in error_str:
                    print(f"Bye! Conversation too long for the API. Total tokens used: {total_tokens}")
                    break
                else:
                    print(f"Error getting response: {e}")
                    # Remove the failed user message from history
                    messages.pop()
                    
        except EOFError:
            # Ctrl+D (or Ctrl+Z or Ctrl+C on Windows) pressed
            print(f"\nBye! Total tokens used: {total_tokens}")
            break
        except KeyboardInterrupt:
            # Ctrl+C pressed
            print(f"\nBye! Total tokens used: {total_tokens}")
            break


if __name__ == "__main__":
    main()
    