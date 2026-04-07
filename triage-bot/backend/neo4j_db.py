from __future__ import annotations
"""
Neo4j Connection — Healthcare Triage Bot
Uses neo4j+ssc:// scheme to bypass SSL cert verification for AuraDB.
"""
import os
from neo4j import AsyncGraphDatabase, AsyncDriver
from dotenv import load_dotenv

load_dotenv()

_RAW_URI = os.getenv("NEO4J_URI", "")
USER     = os.getenv("NEO4J_USER",     "")
PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# neo4j+ssc:// = encrypted but skips certificate verification (needed for AuraDB on Windows)
URI = _RAW_URI.replace("neo4j+s://", "neo4j+ssc://").replace("neo4j://", "neo4j+ssc://")
from typing import Optional

_driver: Optional[AsyncDriver] = None


async def connect_neo4j() -> AsyncDriver:
    global _driver
    _driver = AsyncGraphDatabase.driver(URI, auth=(USER, PASSWORD))
    await _driver.verify_connectivity()
    print(f"[Neo4j] Connected: {URI}")
    return _driver


async def close_neo4j():
    global _driver
    if _driver is not None:
        await _driver.close()
        print("[Neo4j] Connection closed.")


def get_neo4j() -> Optional[AsyncDriver]:
    return _driver
