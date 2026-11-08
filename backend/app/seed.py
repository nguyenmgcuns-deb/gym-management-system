from sqlalchemy.orm import Session

from app.models.exercise import Exercise

# Exercise catalog, grouped by muscle group.
# Groups: Chest, Back, Shoulders, Arms, Legs, Core, Cardio, Full body
EXERCISES_BY_GROUP = {
    "Chest": [
        "Bench press", "Incline bench press", "Decline bench press", "Close-grip bench press",
        "Dumbbell bench press", "Incline dumbbell press", "Decline dumbbell press",
        "Dumbbell fly", "Incline dumbbell fly", "Cable fly", "Low-to-high cable fly",
        "High-to-low cable fly", "Pec deck", "Machine chest press", "Incline machine press",
        "Smith machine bench press", "Floor press", "Dumbbell pullover", "Chest dip",
        "Push-up", "Incline push-up", "Decline push-up", "Diamond push-up", "Wide push-up",
        "Plyometric push-up", "Svend press", "Landmine press", "Resistance band chest press",
    ],
    "Back": [
        "Deadlift", "Sumo deadlift", "Rack pull", "Pull-up", "Chin-up", "Neutral-grip pull-up",
        "Assisted pull-up", "Lat pulldown", "Close-grip lat pulldown", "Wide-grip lat pulldown",
        "Straight-arm pulldown", "Barbell row", "Pendlay row", "Dumbbell row",
        "Chest-supported dumbbell row", "Seated cable row", "Wide-grip cable row", "T-bar row",
        "Machine row", "Meadows row", "Seal row", "Inverted row", "Kroc row",
        "Single-arm cable row", "Back extension", "Good morning", "Superman", "Barbell shrug",
        "Dumbbell shrug", "Trap bar shrug", "Rack pull shrug", "Renegade row",
    ],
    "Shoulders": [
        "Shoulder press", "Overhead barbell press", "Seated dumbbell press", "Arnold press",
        "Machine shoulder press", "Push press", "Landmine shoulder press", "Z press",
        "Lateral raise", "Cable lateral raise", "Machine lateral raise", "Leaning lateral raise",
        "Front raise", "Cable front raise", "Plate front raise", "Rear delt fly",
        "Reverse pec deck", "Cable rear delt fly", "Face pull", "Upright row",
        "Cable upright row", "Band pull-apart", "Pike push-up", "Handstand push-up",
        "Y raise", "Cuban press", "Bradford press",
    ],
    "Arms": [
        "Bicep curl", "Barbell curl", "EZ-bar curl", "Dumbbell curl", "Hammer curl",
        "Incline dumbbell curl", "Preacher curl", "Concentration curl", "Cable curl",
        "Rope hammer curl", "Spider curl", "Bayesian cable curl", "Reverse curl",
        "Zottman curl", "Drag curl", "Machine bicep curl", "Tricep dip", "Bench dip",
        "Tricep pushdown", "Rope tricep pushdown", "Overhead tricep extension",
        "Cable overhead tricep extension", "Skull crusher", "Dumbbell skull crusher",
        "Tricep kickback", "JM press", "Machine tricep extension", "Close-grip push-up",
        "Wrist curl", "Reverse wrist curl", "Farmer's walk", "Plate pinch", "Dead hang",
    ],
    "Legs": [
        "Squat", "Front squat", "High-bar squat", "Low-bar squat", "Box squat", "Pause squat",
        "Goblet squat", "Hack squat", "Smith machine squat", "Belt squat", "Zercher squat",
        "Bulgarian split squat", "Split squat", "Lunge", "Walking lunge", "Reverse lunge",
        "Lateral lunge", "Curtsy lunge", "Step-up", "Leg press", "Single-leg leg press",
        "Leg extension", "Sissy squat", "Pistol squat", "Wall sit", "Romanian deadlift",
        "Dumbbell Romanian deadlift", "Single-leg Romanian deadlift", "Stiff-leg deadlift",
        "Lying leg curl", "Seated leg curl", "Nordic hamstring curl", "Glute-ham raise",
        "Hip thrust", "Barbell glute bridge", "Glute bridge", "Single-leg glute bridge",
        "Cable kickback", "Hip abduction machine", "Hip adduction machine",
        "Cable hip abduction", "Frog pump", "Standing calf raise", "Seated calf raise",
        "Leg press calf raise", "Single-leg calf raise", "Donkey calf raise", "Tibialis raise",
        "Trap bar deadlift", "Jump squat", "Box jump", "Kettlebell swing",
    ],
    "Core": [
        "Plank", "Side plank", "Crunch", "Bicycle crunch", "Reverse crunch", "Cable crunch",
        "Machine crunch", "Sit-up", "Decline sit-up", "V-up", "Hanging leg raise",
        "Hanging knee raise", "Lying leg raise", "Captain's chair leg raise", "Toes-to-bar",
        "Ab wheel rollout", "Dead bug", "Bird dog", "Hollow body hold", "Russian twist",
        "Mountain climber", "Flutter kick", "Heel touch", "Pallof press", "Woodchopper",
        "Cable woodchopper", "Dragon flag", "L-sit", "Windshield wiper", "Stir the pot",
        "Suitcase carry", "Landmine rotation",
    ],
    "Cardio": [
        "Running", "Treadmill run", "Incline treadmill walk", "Walking", "Cycling",
        "Stationary bike", "Spin bike", "Rowing machine", "Elliptical", "Stair climber",
        "Jump rope", "Swimming", "Hiking", "Assault bike", "Ski erg", "Sprints",
        "Hill sprints", "Jumping jacks", "High knees", "Butt kicks", "Battle ropes",
        "Sled push", "Sled pull", "Shadow boxing", "Heavy bag", "Dancing",
    ],
    "Full body": [
        "Burpee", "Clean", "Power clean", "Hang clean", "Clean and jerk", "Snatch",
        "Power snatch", "Thruster", "Dumbbell thruster", "Clean and press",
        "Kettlebell clean", "Kettlebell snatch", "Turkish get-up", "Man maker",
        "Wall ball", "Medicine ball slam", "Bear crawl", "Devil press", "Tire flip",
        "Sandbag carry", "Bear hug carry", "Overhead carry",
    ],
}

# Flat (name, muscle_group) list, used by seed_exercises
DEFAULT_EXERCISES = [
    (name, group) for group, names in EXERCISES_BY_GROUP.items() for name in names
]


def seed_exercises(db: Session) -> None:
    """Insert any catalog exercise that is missing. Safe to run on every startup."""
    existing = {name for (name,) in db.query(Exercise.name).all()}
    for name, muscle_group in DEFAULT_EXERCISES:
        if name not in existing:
            db.add(Exercise(name=name, muscle_group=muscle_group))
            existing.add(name)
    db.commit()
