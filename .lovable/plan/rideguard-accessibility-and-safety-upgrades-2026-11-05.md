# RideGuard accessibility and safety upgrades

## What will change
- Keep every current screen and the established RideGuard look; make key actions easier to recognize through large icons, traffic-light states, short labels, spoken feedback, and an English/Tamil switch.
- Replace the 3D condition illustration with a full-screen, dark particle scooter scene. Add optional draggable webcam hand tracking, gesture actions, a no-camera button fallback, and a parked-only safety gate.
- Add a pre-ride helmet prompt, a four-item icon checklist, and a local safe-rides streak before simulated ignition starts.
- Add Chennai demo hazard and safe-zone pins to Nearby, location-based pothole reporting, and spoken alerts when real phone GPS is near a demo hazard.
- Add a Home anti-theft toggle, movement alarm/red alert, and a simulated event timeline on Family.

## Technical details
- Reuse installed Three.js/React Three Fiber and the existing Google Maps loader; load MediaPipe Hands only when the rider enables the webcam.
- Keep hazard reports, helmet streaks, and anti-theft events local to this browser; label simulated data clearly. Do not add database tables or claim alerts reach other devices or emergency services.
- Use phone GPS speed conservatively: hand gestures remain disabled when speed is unavailable or above 3 km/h. Add focused tests for the parked-only gate and streak behavior.
- Update route metadata for the 3D and Nearby pages, keep camera/model work client-only, and verify the key flows in the running preview.
