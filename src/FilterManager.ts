"use strict"
var logger = require('@dojot/dojot-module-logger').logger;


class FilterManager {

    constructor() {
        //arg1: arg that came on notification
        //arg2: arg on the filter
        this.operationsMap = {
            ">": (arg1, arg2) => {
                logger.debug("> operation", { fileName: "FilterManager" });
                return arg1 > arg2 ? 1 : 0;
            },
            "<": (arg1, arg2) => {
                logger.debug("< operation", { fileName: "FilterManager" });
                return arg1 < arg2 ? 1 : 0;
            },
            "=": (arg1, arg2) => {
                logger.debug("= operation", { fileName: "FilterManager" });
                return arg1 == arg2 ? 1 : 0;
            },
            "!=": (arg1, arg2) => {
                logger.debug("!= operation", { fileName: "FilterManager" });
                return arg1 != arg2 ? 1 : 0;
            }
        }

        this.filters = {};
    }

    /**
     * The operation that was registered in the filter will be applied over two arguments given
     * @param {*} operation 
     * @param {*} arg1 
     * @param {*} arg2 
     */
    applyOperation(operation, arg1, arg2) {
        logger.debug("Gonna apply operation", { fileName: "FilterManager" });
        return this.operationsMap[operation](arg1, arg2);
    }

    update(filter, socketId) {
        logger.debug(`Registering new filter for socket ${socketId}`, { "filename": "FilterManager" });

        this.filters[socketId] = filter;
        logger.debug(`Displaying current filters map: ${JSON.stringify(this.filters)}`, { "filename": "FilterManager" });

    }

    removeFilter(socketId){
        delete this.filters[socketId];
    }

    /**
     * Apply the connection filter to the message to check if it will be forward to the application by SocketIO
     * @param {string} msg 
     */
    checkFilter(msg, socketId) {
        logger.debug("Checking filter", { "filename": "FilterManager" });
        let retOperation;
        msg = JSON.parse(msg);
        if (this.filters.hasOwnProperty(socketId)) {
            for (var key in this.filters[socketId]['fields']) {
                if (this.filters[socketId].fields.hasOwnProperty(key)) {
                    if (key === "subject") {
                        if (msg.hasOwnProperty('subject')) {
                            retOperation = this.applyOperation(this.filters[socketId].fields['subject']['operation'],
                                msg['subject'], this.filters[socketId].fields['subject']['value']);
                            logger.debug(`Return from operation over field subject is ${retOperation}`, { "filename": "FilterManager" });
                            if (!retOperation) {
                                return retOperation;
                            }
                        }
                    } else {
                        if (msg['metaAttrsFilter'].hasOwnProperty(key)) {
                            retOperation = this.applyOperation(this.filters[socketId].fields[key]['operation'],
                                msg['metaAttrsFilter'][key], this.filters[socketId].fields[key]['value']);
                            logger.debug(`Return from operation over field ${key} is ${retOperation}`, { "filename": "FilterManager" });
                            if (!retOperation) {
                                return retOperation;
                            }
                        }
                    }
                }
            }
        }
        return 1;
    }

}

export { FilterManager }