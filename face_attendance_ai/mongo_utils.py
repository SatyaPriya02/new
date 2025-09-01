#!/usr/bin/env python3
"""
MongoDB utilities for face verification system
"""
import os
import base64
import tempfile
import pymongo
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class MongoPhotoManager:
    def __init__(self, mongo_uri: str = None):
        """Initialize MongoDB connection for photo management"""
        self.mongo_uri = mongo_uri or os.getenv('MONGO_URI', 'mongodb+srv://neelamdheerajkumar:DrNltjHB5DTevVUE@attendance.itpn8hv.mongodb.net/?retryWrites=true&w=majority&appName=Attendance
')
        self.client = None
        self.db = None
        self.employees_collection = None
        
    def connect(self):
        """Connect to MongoDB"""
        try:
            # If no MONGO_URI provided, connect to local MongoDB
            if not self.mongo_uri:
                self.client = pymongo.MongoClient('mongodb://43.205.94.38:27017/')
                self.db = self.client.employee_attendance
            else:
                self.client = pymongo.MongoClient(self.mongo_uri)
                self.db = self.client.get_default_database()
                if not self.db.name:
                    self.db = self.client.employee_attendance
            
            self.employees_collection = self.db.employees
            
            # Test connection
            self.employees_collection.find_one()
            logger.info(f"Connected to MongoDB: {self.db.name}")
            return True
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            return False
    
    def get_all_employee_photos(self) -> List[Dict]:
        """Get all employee photos from MongoDB"""
        try:
            employees = list(self.employees_collection.find(
                {"photo": {"$exists": True, "$ne": None}},
                {"empId": 1, "name": 1, "photo": 1, "_id": 0}
            ))
            logger.info(f"Retrieved {len(employees)} employee photos from MongoDB")
            return employees
        except Exception as e:
            logger.error(f"Failed to retrieve employee photos: {e}")
            return []
    
    def get_employee_photo(self, emp_id: str) -> Optional[str]:
        """Get specific employee photo by empId"""
        try:
            employee = self.employees_collection.find_one(
                {"empId": emp_id},
                {"photo": 1, "_id": 0}
            )
            return employee.get('photo') if employee else None
        except Exception as e:
            logger.error(f"Failed to get photo for {emp_id}: {e}")
            return None
    
    def save_base64_to_temp(self, base64_data: str, prefix: str = "temp_") -> str:
        """Save base64 image data to temporary file"""
        try:
            # Remove data URL prefix if present
            if base64_data.startswith('data:image'):
                base64_data = base64_data.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_data)
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', prefix=prefix) as temp_file:
                temp_file.write(image_bytes)
                return temp_file.name
                
        except Exception as e:
            logger.error(f"Failed to save base64 to temp file: {e}")
            raise
    
    def cleanup_temp_file(self, file_path: str):
        """Clean up temporary file"""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup temp file {file_path}: {e}")
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

# Global instance
photo_manager = MongoPhotoManager()
