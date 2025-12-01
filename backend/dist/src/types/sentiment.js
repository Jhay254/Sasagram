"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregationPeriod = exports.EmotionCategory = void 0;
/**
 * Emotion categories
 */
var EmotionCategory;
(function (EmotionCategory) {
    EmotionCategory["JOY"] = "Joy";
    EmotionCategory["SADNESS"] = "Sadness";
    EmotionCategory["ANGER"] = "Anger";
    EmotionCategory["FEAR"] = "Fear";
    EmotionCategory["SURPRISE"] = "Surprise";
    EmotionCategory["DISGUST"] = "Disgust";
    EmotionCategory["CONTENTMENT"] = "Contentment";
    EmotionCategory["EXCITEMENT"] = "Excitement";
    EmotionCategory["ANXIETY"] = "Anxiety";
    EmotionCategory["NEUTRAL"] = "Neutral";
})(EmotionCategory || (exports.EmotionCategory = EmotionCategory = {}));
/**
 * Aggregation period for mood data
 */
var AggregationPeriod;
(function (AggregationPeriod) {
    AggregationPeriod["DAILY"] = "daily";
    AggregationPeriod["WEEKLY"] = "weekly";
    AggregationPeriod["MONTHLY"] = "monthly";
})(AggregationPeriod || (exports.AggregationPeriod = AggregationPeriod = {}));
