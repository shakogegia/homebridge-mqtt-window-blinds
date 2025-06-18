let CURRENT_POSITION = 0;
let TOTAL_TRAVEL_TIME = 17000; // Default 30 seconds

function initializeState(initialPosition = 0, travelTime = 30000) {
    CURRENT_POSITION = initialPosition;
    TOTAL_TRAVEL_TIME = travelTime;
}

function getCurrentPosition() {
    return CURRENT_POSITION;
}

function setCurrentPosition(position) {
    CURRENT_POSITION = position;
}

function getTotalTravelTime() {
    return TOTAL_TRAVEL_TIME;
}

module.exports = {
    initializeState,
    getCurrentPosition,
    setCurrentPosition,
    getTotalTravelTime,
    CURRENT_POSITION: getCurrentPosition,
    TOTAL_TRAVEL_TIME: getTotalTravelTime
};