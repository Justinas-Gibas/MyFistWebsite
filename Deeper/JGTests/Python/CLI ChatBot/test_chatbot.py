"""
Unit tests for the CLI ChatBot.

Run with: pytest test_chatbot.py
"""

import sys
import os
import importlib.util

# Import the module (handling the numeric filename)
spec = importlib.util.spec_from_file_location(
    "chatbot", 
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "1.py")
)
chatbot = importlib.util.module_from_spec(spec)

# Prevent main() from running during import by mocking sys.argv
original_argv = sys.argv
sys.argv = ["1.py", "test_key", "TestBot"]
spec.loader.exec_module(chatbot)
sys.argv = original_argv


def test_create_system_message():
    """Test that system message is created correctly with bot name."""
    result = chatbot.create_system_message("TestBot")
    
    assert result["role"] == "system"
    assert "TestBot" in result["content"]
    assert isinstance(result, dict)


def test_format_user_message():
    """Test that user messages are formatted correctly."""
    result = chatbot.format_user_message("Hello, world!")
    
    assert result["role"] == "user"
    assert result["content"] == "Hello, world!"


def test_format_assistant_message():
    """Test that assistant messages are formatted correctly."""
    result = chatbot.format_assistant_message("Hi there!")
    
    assert result["role"] == "assistant"
    assert result["content"] == "Hi there!"


def test_system_message_contains_name():
    """Test that the system message properly includes the bot name twice."""
    bot_name = "Astra"
    result = chatbot.create_system_message(bot_name)
    
    # The bot name should appear twice in the content
    assert result["content"].count(bot_name) == 2


def test_message_structure():
    """Test that messages have the required structure for the API."""
    user_msg = chatbot.format_user_message("test")
    assistant_msg = chatbot.format_assistant_message("response")
    
    # Both should have exactly 'role' and 'content' keys
    assert set(user_msg.keys()) == {"role", "content"}
    assert set(assistant_msg.keys()) == {"role", "content"}
