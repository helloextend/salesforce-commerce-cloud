/* eslint-disable valid-jsdoc */
/* eslint-disable no-continue */
/* eslint-disable new-cap */
/* eslint-disable no-loop-func */
/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');

/**
 * @function create
 * @returns {dw.system.Status}
 */
exports.create = function () {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var ArrayList = require('dw/util/ArrayList');

    var extendContractsCO = CustomObjectMgr.getAllCustomObjects('ExtendContractsQueue');

    while (extendContractsCO.hasNext()) {
        var contractCO = extendContractsCO.next();
        var contract = extend.createContracts(contractCO);

        if (!contract.id) {
            continue;
        }

        if (!contract.error) {
            // Update corresponding order line item with the contract number
            var order = OrderMgr.getOrder(contractCO.custom.orderNo);

            if (order) {
                var orderLogObject = jobHelpers.getContractLoggerModel(order);
                logger.info(JSON.stringify(orderLogObject));
            }

            var liuuid = contractCO.custom.LIUUID.substring(0, contractCO.custom.LIUUID.indexOf('-'));

            for (var i = 0; i < order.productLineItems.length; i++) {
                var pLi = order.productLineItems[i];

                if (pLi.UUID === liuuid) {
                    var extendContractIds = ArrayList(pLi.custom.extendContractId);
                    extendContractIds.add(contract.id);

                    Transaction.wrap(function () {
                        pLi.custom.extendContractId = extendContractIds;
                    });

                    break;
                }
            }

            // Decrement queue
            Transaction.wrap(function () {
                CustomObjectMgr.remove(contractCO);
            });
        } else {
            logger.debug(JSON.stringify({ errorCode: contract.errorCode, errorMessage: contract.errorMessage }));
            Transaction.wrap(function () {
                contractCO.custom.log = contract.errorCode + ' ' + contract.errorMessage;
            });
        }
    }

    extendContractsCO.close();

    return new Status(Status.OK, 'OK', 'Contracts Creation job completed');
};
