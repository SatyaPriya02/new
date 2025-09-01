import os
from deepface import DeepFace

# Pre-load the model to avoid delays and potential startup issues
print("Building and pre-loading FaceNet model...")
try:
    DeepFace.build_model("Facenet")
    print("FaceNet model built successfully.")
except Exception as e:
    print(f"Could not build FaceNet model: {e}")
from constants import (
    REGISTERED_FACES_DIR, FACE_DISTANCE_THRESHOLD, 
    FACE_MODEL, DETECTOR_BACKEND, SUPPORTED_IMAGE_FORMATS
)
from mongo_utils import photo_manager
import logging

logger = logging.getLogger(__name__)

def verify_face_from_mongodb(input_path, model=FACE_MODEL):
    """Verify face against employee photos stored in MongoDB"""
    try:
        # Connect to MongoDB and get employee photos
        if not photo_manager.connect():
            logger.error("Failed to connect to MongoDB")
            return {"verified": False, "matched_with": None, "score": None}
        
        employees = photo_manager.get_all_employee_photos()
        if not employees:
            logger.warning("No employee photos found in MongoDB")
            return {"verified": False, "matched_with": None, "score": None}
        
        logger.info(f"Comparing against {len(employees)} registered employees")
        
        for employee in employees:
            emp_id = employee['empId']
            emp_name = employee['name']
            photo_base64 = employee['photo']
            
            try:
                # Save employee photo to temporary file
                ref_path = photo_manager.save_base64_to_temp(photo_base64, f"ref_{emp_id}_")
                
                # Perform face verification
                result = DeepFace.verify(
                    img1_path=input_path,
                    img2_path=ref_path,
                    model_name=model,
                    detector_backend=DETECTOR_BACKEND,
                    enforce_detection=False
                )
                
                # Cleanup temp file
                photo_manager.cleanup_temp_file(ref_path)
                
                if result["verified"] and result["distance"] < FACE_DISTANCE_THRESHOLD:
                    logger.info(f"Face matched with {emp_id} ({emp_name})")
                    return {
                        "verified": True,
                        "matched_with": emp_id,
                        "employee_name": emp_name,
                        "score": result["distance"]
                    }
                    
            except Exception as e:
                logger.error(f"Error verifying against {emp_id}: {e}")
                # Cleanup temp file on error
                if 'ref_path' in locals():
                    photo_manager.cleanup_temp_file(ref_path)
                continue
        
        logger.info("No face match found")
        return {"verified": False, "matched_with": None, "score": None}
        
    except Exception as e:
        logger.error(f"Face verification from MongoDB failed: {e}")
        return {"verified": False, "matched_with": None, "score": None}
    finally:
        photo_manager.close()

def verify_face(input_path, known_faces_dir=REGISTERED_FACES_DIR, model=FACE_MODEL):
    """Legacy file-based face verification (fallback)"""
    for person in os.listdir(known_faces_dir):
        # Skip non-image files like .gitkeep
        if not person.lower().endswith(SUPPORTED_IMAGE_FORMATS):
            continue
            
        ref_path = os.path.join(known_faces_dir, person)
        try:
            result = DeepFace.verify(img1_path=input_path,
                                     img2_path=ref_path,
                                     model_name=model,
                                     detector_backend=DETECTOR_BACKEND,
                                     enforce_detection=False)
            if result["verified"] and result["distance"] < FACE_DISTANCE_THRESHOLD:
                return {
                    "verified": True,
                    "matched_with": person,
                    "score": result["distance"]
                }
        except Exception as e:
            print(f"Error verifying {person}: {e}")
    return {"verified": False, "matched_with": None, "score": None}