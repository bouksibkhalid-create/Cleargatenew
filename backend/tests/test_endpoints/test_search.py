"""Test search endpoint"""

import pytest
import json
from netlify.functions.search import handler


def test_search_endpoint_success():
    """Test successful search endpoint call"""
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "query": "Vladimir Putin",
            "limit": 5
        })
    }
    
    response = handler(event, None)
    
    assert response["statusCode"] == 200
    assert "Access-Control-Allow-Origin" in response["headers"]
    
    body = json.loads(response["body"])
    assert body["query"] == "Vladimir Putin"
    assert body["total_results"] >= 0
    assert isinstance(body["results"], list)
    assert "timestamp" in body
    assert "sanctioned_count" in body


def test_search_endpoint_validation_error():
    """Test validation error handling"""
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "query": "A",  # Too short
            "limit": 5
        })
    }
    
    response = handler(event, None)
    
    assert response["statusCode"] == 400
    
    body = json.loads(response["body"])
    assert body["error"] == "ValidationError"
    assert "message" in body


def test_search_endpoint_missing_query():
    """Test missing query parameter"""
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "limit": 5
        })
    }
    
    response = handler(event, None)
    
    assert response["statusCode"] == 400


def test_search_endpoint_cors():
    """Test CORS headers"""
    event = {
        "httpMethod": "OPTIONS"
    }
    
    response = handler(event, None)
    
    assert response["statusCode"] == 200
    assert "Access-Control-Allow-Origin" in response["headers"]
    assert "Access-Control-Allow-Methods" in response["headers"]
    assert "Access-Control-Allow-Headers" in response["headers"]


def test_search_endpoint_invalid_json():
    """Test invalid JSON handling"""
    event = {
        "httpMethod": "POST",
        "body": "invalid json"
    }
    
    response = handler(event, None)
    
    assert response["statusCode"] == 500


def test_search_endpoint_limit_validation():
    """Test limit parameter validation"""
    # Test limit too high
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "query": "Test",
            "limit": 100  # Exceeds max of 50
        })
    }
    
    response = handler(event, None)
    assert response["statusCode"] == 400
    
    # Test limit too low
    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "query": "Test",
            "limit": 0
        })
    }
    
    response = handler(event, None)
    assert response["statusCode"] == 400
