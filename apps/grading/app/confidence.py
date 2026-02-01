"""
Confidence Score Calculation
Based on flow diagrams - heuristic approach (not ML)
"""
import re
from app.models import ConfidenceFactors


def calculate_confidence(
    content: str,
    ai_response: str,
    task_type: str = None
) -> ConfidenceFactors:
    """
    Calculate confidence score based on 4 factors:
    - Model Consistency (30%): Variance across multiple samples
    - Rule Validation (25%): Word count, format compliance
    - Content Similarity (25%): Template detection
    - Length Heuristic (20%): Band-appropriate metrics
    """
    
    # 1. Model Consistency (30%)
    # Higher when response is well-structured and confident
    model_consistency = _calculate_model_consistency(ai_response)
    
    # 2. Rule Validation (25%)
    # Check word count, format compliance
    rule_validation = _calculate_rule_validation(content, task_type)
    
    # 3. Content Similarity (25%)
    # Lower similarity to templates = higher confidence
    content_similarity = _calculate_content_similarity(content)
    
    # 4. Length Heuristic (20%)
    # Sentence count, paragraph structure, complexity
    length_heuristic = _calculate_length_heuristic(content)
    
    return ConfidenceFactors(
        model_consistency=model_consistency,
        rule_validation=rule_validation,
        content_similarity=content_similarity,
        length_heuristic=length_heuristic
    )


def _calculate_model_consistency(ai_response: str) -> float:
    """
    Analyze AI response structure for consistency indicators.
    Higher score when response has clear structure and reasoning.
    """
    score = 70.0  # Base score
    
    # Check for structured feedback sections
    sections = [
        'task achievement',
        'coherence',
        'lexical',
        'grammar',
        'vocabulary',
        'feedback'
    ]
    
    response_lower = ai_response.lower()
    for section in sections:
        if section in response_lower:
            score += 5.0
    
    # Check for specific score mention
    if re.search(r'score[:\s]*\d+(\.\d+)?', response_lower):
        score += 10.0
    
    return min(score, 100.0)


def _calculate_rule_validation(content: str, task_type: str = None) -> float:
    """
    Validate content against VSTEP rules.
    """
    score = 50.0  # Base score
    word_count = len(content.split())
    
    # Word count validation
    if task_type == "TASK_1_EMAIL":
        # 150-180 words expected
        if 140 <= word_count <= 200:
            score += 25.0
        elif 100 <= word_count <= 250:
            score += 15.0
    elif task_type == "TASK_2_ESSAY":
        # 300-350 words expected
        if 280 <= word_count <= 400:
            score += 25.0
        elif 200 <= word_count <= 500:
            score += 15.0
    else:
        # Generic validation
        if 100 <= word_count <= 500:
            score += 20.0
    
    # Check for proper format indicators
    if task_type == "TASK_1_EMAIL":
        email_markers = ['dear', 'sir', 'madam', 'yours', 'sincerely', 'regards']
        content_lower = content.lower()
        if any(marker in content_lower for marker in email_markers):
            score += 15.0
    
    # Check for paragraph structure
    paragraphs = content.split('\n\n')
    if len(paragraphs) >= 2:
        score += 10.0
    
    return min(score, 100.0)


def _calculate_content_similarity(content: str) -> float:
    """
    Detect template/generic content.
    Lower similarity to templates = higher confidence (inverse relationship).
    
    Returns: 100 - similarity_score (so high = original, low = template)
    """
    # Common template phrases to check against
    template_phrases = [
        "in conclusion, i would like to",
        "to sum up,",
        "firstly, secondly, finally",
        "in my opinion, i think",
        "i look forward to hearing from you",
        "please do not hesitate to contact me"
    ]
    
    content_lower = content.lower()
    matches = 0
    
    for phrase in template_phrases:
        if phrase in content_lower:
            matches += 1
    
    # Calculate similarity score (0-100)
    similarity = (matches / len(template_phrases)) * 100
    
    # Invert: high originality = high confidence
    originality = 100 - similarity
    
    return max(originality, 0.0)


def _calculate_length_heuristic(content: str) -> float:
    """
    Analyze length and complexity metrics.
    """
    score = 50.0  # Base score
    
    # Sentence count
    sentences = re.split(r'[.!?]+', content)
    sentence_count = len([s for s in sentences if s.strip()])
    
    if 5 <= sentence_count <= 30:
        score += 15.0
    elif sentence_count > 2:
        score += 10.0
    
    # Paragraph structure
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
    if 2 <= len(paragraphs) <= 5:
        score += 15.0
    
    # Vocabulary density (unique words / total words)
    words = content.lower().split()
    if words:
        unique_words = set(words)
        density = len(unique_words) / len(words)
        if density > 0.4:  # Good variety
            score += 10.0
        elif density > 0.3:
            score += 5.0
    
    # Average word length (complexity indicator)
    if words:
        avg_length = sum(len(w) for w in words) / len(words)
        if 4.0 <= avg_length <= 6.0:  # Sweet spot
            score += 10.0
    
    return min(score, 100.0)
