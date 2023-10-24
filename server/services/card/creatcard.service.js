// import { use } from 'chai';
const rave = ('../config/flutterwave_init');
import model from '../../models';
const httpStatus = require("http-status");
// import { findUserByEmail, findUserById, getUserBalance } from '../services/user.service';

/**
 * Create card with flutterwave
 *
 * @param {Object} data
 * @param {String} cardType
 * @param {String} redirect_url
 * @returns {Promise<Card>}
 */
const createCard = async (data, cardType, UserId) => {
    switch(cardType){
    //Basic Card
    // Can be loaded up to 5 times
    //No freezing or withdrawals allowed. 
    //- Creation fee of $5 and no monthly fee.
        case "BASICC":
            loadable = 5

            // Check if user is already subscribed to that card
            // and if so, refuse to create duplicate
            const checkCard = await model.CardTypes.findOne({
                where: {
                    UserId: UserId,
                },
                });

            if (checkCard.name == 'BASICC' && checkCard.expired == false) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "ALready Subscribed To This Card",
                });
            }

            const cardTypeUpdate = await model.CardTypes.create({
                    name: cardType,
                    loadable: loadable,
                    creationFee: parseFloat(5),
                    monthlyFee: parseFloat(0),
                    UserId: UserId,
            });
            const cardfee = await model.CardFees.create({
                monthlyFee: parseFloat(0),
                UserId: UserId,
                CardTypeId: cardTypeUpdate.id,
            })

                //Create card
            const response = await rave.VirtualCards.create(data);
            const { id } = response;

            //create card table on our db
            const cardUpdate = await model.Cards.create({
                cardIds: id,
                UserId: UserId,
                CardTypeId: cardTypeUpdate.id
            });

            return(response);
}
}

module.exports = {
    createCard,
}