# ===============================================================
# FILE: rag/youtube_loader.py
# PURPOSE: Extract transcripts from YouTube videos.
#          YouTube transcripts = auto-generated subtitles.
#          We fetch them, clean them, and chunk them for RAG.
# ===============================================================

import re
from typing import List, Tuple

from youtube_transcript_api import YouTubeTranscriptApi

from .document_loader import chunk_text


def extract_video_id(url: str) -> str:
    """
    Extract YouTube video ID from various URL formats.
    Examples:
      https://www.youtube.com/watch?v=dQw4w9WgXcQ -> dQw4w9WgXcQ
      https://youtu.be/dQw4w9WgXcQ                -> dQw4w9WgXcQ
    """
    patterns = [
        r"(?:youtube\.com/watch\?v=)([a-zA-Z0-9_-]{11})",
        r"(?:youtu\.be/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    raise ValueError(f"Could not extract YouTube video ID from URL: {url}")


def get_youtube_transcript(url: str) -> Tuple[str, List[str], dict]:
    """
    Fetch YouTube transcript and return text + chunks + metadata.
    Returns: (full_transcript, [chunk1, chunk2, ...], metadata_dict)
    """
    video_id = extract_video_id(url)

    try:
        # Fetch transcript: tries English first, then any available.
        transcript_list = YouTubeTranscriptApi.get_transcript(
            video_id,
            languages=["en", "en-US", "en-GB"],
        )
    except Exception:
        try:
            transcripts = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcripts.find_generated_transcript(["en"])
            transcript_list = transcript.fetch()
        except Exception as exc:
            raise ValueError(f"Could not fetch transcript: {str(exc)}") from exc

    # Combine all transcript segments into one text.
    # Each segment has: text, start (seconds), duration (seconds).
    full_text = " ".join(
        segment.get("text", "").strip()
        for segment in transcript_list
        if segment.get("text", "").strip()
    )

    # Clean up transcript artifacts.
    full_text = re.sub(r"\[.*?\]", "", full_text)
    full_text = re.sub(r"\s+", " ", full_text).strip()

    if not full_text:
        raise ValueError("Transcript is empty.")

    chunks = chunk_text(full_text, chunk_size=400, chunk_overlap=40)

    metadata = {
        "video_id": video_id,
        "video_url": url,
        "segment_count": len(transcript_list),
        "source_type": "youtube",
    }

    return full_text, chunks, metadata
