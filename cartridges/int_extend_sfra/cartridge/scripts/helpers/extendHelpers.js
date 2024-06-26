/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable block-scoped-var */
/* eslint-disable consistent-return */
'use strict';

var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var Site = require('dw/system/Site').getCurrent();

/**
 * Return used plan for added extend product
 * @param {Object} plans - object with plans get from extend API
 * @param {Object} extendPlanId - id of used plan for added extend product
 * @returns {Object} - current plan in plans object
 */
function getUsedPlan(plans, extendPlanId) {
    var extendAPIMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;
    if (extendAPIMethod === 'contractsAPIonSchedule' && extendAPIMethod) {
        for (var j = 0; j < plans.base.length; j++) {
            var currentPlan = plans.base[j];
            if (currentPlan.id === extendPlanId) {
                return currentPlan;
            }
        }
    } else {
        var plansKeys = Object.keys(plans);
        for (var i = 0; i < plansKeys.length; i++) {
            var currentPlanType = plans[plansKeys[i]];
            if (!empty(currentPlanType)) {
                for (var j = 0; j < currentPlanType.length; j++) {
                    var currentPlan = currentPlanType[j];
                    if (currentPlan.id === extendPlanId) {
                        return currentPlan;
                    }
                }
            }
        }
    }
}

/**
 * Return is offer valid
 * @param {Object} formObject - formObject with offer information
 * @returns {boolean} - is offer price valid
 */
function validateOffer(formObject) {
    var extend = require('~/cartridge/scripts/extend');
    var offerInfo = {};
    var isValid = false;

    var purchaseCondition = formObject.pid || formObject.leadToken;

    if (!formObject.extendPlanId || !purchaseCondition || !formObject.extendPrice) {
        return isValid;
    }

    var offer = extend.getOffer(formObject);

    if (formObject.leadToken) {
        coverageType = offer.plans.adh.recomended || offer.plans.adh.recomended;

        offerInfo.isValid = true;
        offerInfo.coverageType = coverageType;

        return offerInfo;
    }

    var usedPlan = getUsedPlan(offer.plans, formObject.extendPlanId);

    if (!usedPlan) {
        logger.error('Extend warranty plan with id "{0}" could not be found.', formObject.extendPlanId);
        return isValid;
    }

    if (+formObject.extendPrice !== usedPlan.price) {
        logger.error('Wrong price for the warranty plan with id "{0}". Wrong: {1}. Correct: {2} ',
            formObject.extendPlanId,
            +formObject.extendPrice,
            usedPlan.price
        );
        return isValid;
    }

    var coverageType = usedPlan.contract.coverageIncludes;

    offerInfo.isValid = true;
    offerInfo.coverageType = coverageType;

    return offerInfo;
}

module.exports = {
    validateOffer: validateOffer
};
