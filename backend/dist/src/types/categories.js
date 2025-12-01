"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_TAGS = exports.BiographyCategory = void 0;
/**
 * Primary categories for biography events
 */
var BiographyCategory;
(function (BiographyCategory) {
    BiographyCategory["EARLY_LIFE"] = "Early Life";
    BiographyCategory["EDUCATION"] = "Education";
    BiographyCategory["CAREER"] = "Career";
    BiographyCategory["FAMILY"] = "Family & Relationships";
    BiographyCategory["TRAVEL"] = "Travel & Adventure";
    BiographyCategory["HOBBIES"] = "Hobbies & Interests";
    BiographyCategory["ACHIEVEMENTS"] = "Achievements & Awards";
    BiographyCategory["SOCIAL"] = "Social Life";
    BiographyCategory["HEALTH"] = "Health & Wellness";
    BiographyCategory["SPIRITUALITY"] = "Spirituality & Beliefs";
    BiographyCategory["SIGNIFICANT_EVENTS"] = "Significant Life Events";
    BiographyCategory["DAILY_LIFE"] = "Daily Life";
    BiographyCategory["OTHER"] = "Other";
})(BiographyCategory || (exports.BiographyCategory = BiographyCategory = {}));
/**
 * Common tags for finer granularity
 */
exports.COMMON_TAGS = [
    'Birth', 'School', 'University', 'Graduation',
    'First Job', 'Promotion', 'New Job', 'Retirement',
    'Dating', 'Marriage', 'Divorce', 'Children', 'Pet',
    'Vacation', 'Relocation', 'Home Purchase',
    'Concert', 'Festival', 'Sports', 'Art',
    'Illness', 'Recovery',
    'Loss', 'Celebration',
];
