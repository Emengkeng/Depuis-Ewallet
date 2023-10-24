import model from '../../models';
import creatCard from './creatcard.service'
const uuid = require('uuid');
const { checkCard, giveBackUserMoney } = require('../user/user.service')
/* const { sendMail } = require('../') */
const httpStatus = require("http-status");

/**
 * Gift a Card 
 * @param {String} cardType
 * @param {String} UserId
 * @param {String} recieverName
 * @param {String} gifterId
 * @param {Date} date
 * @returns {Promise<giftCard>}
 */

const giftCard = async ( cardType, UserId, amount, recieverName, gifterId, date, cardstatus) => {
    switch (cardType) {
        case BASICC:
            // Check if user is already subscribed to that card
            // and if so, refuse to create duplicate
            const checkcard = await checkCard(UserId);

            if (checkcard.name == 'BASICC') {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "The User Is Already Subscribed TO This Card",
                });
            }

            acceptlink = uuid.v4();

            const cardGiftUpdate = await model.GiftCards.create({
                recipient: UserId,
                amount: amount,
                accepted: false,
                expiresIn: date,
                expired: false,
                cardType: cardType,
                acceptLink: acceptlink,
                status: cardstatus,
                UserId: gifterId,
            })
            // const sendEmail = await sendMail.giftCard(user.email, `${process.env.APP_URL}/card/accept/${acceptlink}`, recieverName);
            return cardGiftUpdate;
    }
};

const rejectCard = async(amount, gifterId, activationLink, cardstatus) => {

    const check = await model.GiftCards.update({
        accepted: false,
        expiresIn: null,
        expired: true,
        status: cardstatus,
    },
        {
        where:{
            acceptLink: activationLink,
        }
    });

    const giveback = await giveBackUserMoney(gifterId, amount)

    //Todo 
    //Email to tell user his card was rejected 

    return giveback;
}


module.default = {
    giftCard,
    rejectCard,
}