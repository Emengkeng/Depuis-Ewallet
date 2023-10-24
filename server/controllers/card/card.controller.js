import { json } from 'express';
import rave from '../../config/flutterwave_init';
import fee from '../../config/cardfee';
import model from '../../models';
import axios from 'axios';
const { validationResult } = require("express-validator");
const httpStatus = require("http-status");
import { createCard } from '../../services/creatcard.service';
import { fundCard } from '../../services/fundcard.service';
import { giftCard, rejectCard } from '../../services/giftcard.service';
import { findUserByEmail, findUserById, getUserBalance } from '../../services/user.service';
const catchAsync = require("../../utils/catchasync");
const BadRequestError = require("../../utils/errors/badrequest.error");

require('dotenv').config();


const create_Vcard = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
        // Get data from req
        const { 
            amount, 
            billing_name, 
            billing_address, 
            billing_city, 
            billing_state, 
            billing_postal_code,
            billing_country,
            first_name,
            last_name,
            date_of_birth,
            email,
            phone,
            title,
            gender,
            cardtype,
        } = req.body;

        const { id: UserId } = req.user;

        const data = /* JSON.stringify */(
            {
                "currency": "USD",
                "amount": amount,
                "debit_currency": "USD",
                "billing_name": billing_name, //"Example User."
                "billing_address": billing_address, //"333, Fremont Street"
                "billing_city": billing_city, //"San Francisco"
                "billing_state": billing_state, //"CA"
                "billing_postal_code": billing_postal_code, //"94105"
                "billing_country": billing_country, //"US"
                "first_name": first_name,
                "last_name": last_name,
                "date_of_birth": date_of_birth, //"1996/12/30"
                "email": email, //"userg@example.com"
                "phone": phone, //"07030000000"
                "title": title, //"MR"
                "gender": gender, //"M"
                "callback_url": process.env.CALLBACKURL,//"https://webhook.site/b67965fa-e57c-4dda-84ce-0f8d6739b8a5"
            }
        )

        // Find User
        const user = await findUserById(UserId);
        
        if(!user) {
            console.log('No user Found')
            return res.json({
                message: 'No user found',
            })
        }

        // Get User balance 
        const accountDetails = await getUserBalance(UserId);
        const { balance } = accountDetails.dataValues;
        console.log(balance);

        // Logic check before creating card
        const amt = parseFloat(balance);
        console.log('amount', amt);

        // New amount is the amount the user wants to deposit in 
        //Card upon creation

        const newAmount = amount + fee[cardtype];

        if (amt < newAmount) {
            return res.status(403).json({
                message: 'Not Enough Balance to Gift Card',
            });
        }
        
        //Create Card
        const response = await createCard(data, cardtype, UserId);

        //Update user Balance
        const newBalance = amt - parseFloat(newAmount);
        const update = await model.Accounts.update(
            {
                balance: newBalance,
            },
            {
                where: {
                    UserId,
                },
            }
        );
        console.log('update', update);


        return res.status(httpStatus.CREATED).json({
            success: true,
            message: "Card Created successfully!",
            data: {
                ...response
            },
        });

});

    // Fund a virtual card
const fund_Vcard = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    
    try {
        const { id: UserId } = req.user;
        const { CardId, amount} = req.body;
        const { cardType } = req.body;

        const data = /* JSON.stringify */({
            id: CardId,
            debit_currency: "USD",
            amount: amount,
        });


            // Find Card
        const card = await model.Cards.findOne({
            where: {
                cardIds: CardId,
            }
        })

        if(!card) {
            console.log('No Card Found')
            return res.json({
                message: 'No Card found',
            })
        }

        // Get User balance 
        const accountDetails = await model.Accounts.findOne({
            where: { UserId: UserId },
        });
        const { balance } = accountDetails.dataValues;

        // Logic check before creating card
        const amt = parseFloat(balance);
        console.log('amount', amt);
        if (amt < amount) {
            return res.status(403).json({
                message: 'Not Enough Balance to Debit Card',
            });
        };

        //Update user Balance
        const newBalance = amt - parseFloat(amount);
        const update = await model.Accounts.update(
            {
                balance: newBalance,
            },
            {
                where: {
                    UserId,
                },
            }
        );
        console.log('update', update);

        const response = await rave.VirtualCards.fund(data);
        //const response = await fundCard(data, cardType, UserId);
        
        return res.status(httpStatus.CREATED).json({
            success: true,
            message: "Fund Card successfully!",
            data: {
                ...response
            },
        });
    } catch (error) {
            // handle error here
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: error,
        })
    }
});

    // List all card created by admin 
const list_Vcard = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    const payload = {
        page:req.body.payload,
    };
    const response = await rave.VirtualCards.list(payload);

    return res.status(httpStatus.OK).json({
        success: true,
        message: "List Of All Cards",
        data: {
            ...response
        },
    });
});

    

    // Get a single card from id 
const get_Vcard = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    const { cardId } = req.body
    const payload = {
        id: cardId
    };
    try {
        const response = await rave.VirtualCards.get(payload);
        return res.status(httpStatus.OK).json({
            success: true,
            message: "Card Gotten Succesfully",
            data: {
                ...response
            },
        });
    } catch (error) {
        // handle error here
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: error,
        })
    }
});

    // Fetch all transaction for a card  
const fetch_trans_Vcard = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    const { fromDate,toDate, cardId } = req.body;

    const payload = {
        FromDate: fromDate, //"2019-02-13"
        ToDate: toDate, //"2020-12-21"
        PageIndex: "0",
        PageSize: "20",
        CardId: cardId,
    };
    try {
        const response = await rave.VirtualCards.fetchTransactions(payload);
        return res.status(httpStatus.OK).json({
            success: true,
            message: "Fetch Transaction Detail successfully",
            data: {
                ...response
            },
        });
    } catch (error) {
        // handle error here
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: error,
        })
    }
});

    // Withdraw money from card 
const withdraw_funds = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    const { amount, UserId, cardId } = req.body;
    const payload = {
        amount: amount,
        card_id: cardId, //"e9ca13bd-36b4-4691-9ee6-e23d7f2e196c"
    };

    // check card balance

    ///Logic to be implemented

    try {
        const response = await rave.VirtualCards.withdraw(payload);
        return res.status(httpStatus.OK).json({
            success: true,
            message: "Withdraw from Card successfully!",
            data: {
                ...response
            },
        });
    } catch (error) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: error,
        })
    }
});

const pay_Vcard = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    try {
        const resp = await rave.Card.charge(req.body)
        const response = await rave.Card.validate({
            "transaction_reference":resp.body.data.flwRef,
            "otp":12345 // your otp code
        })
        
        return res.status(200).json({
            status: 200,
            data: {
                ...response.body
            },
        });
    } catch (error) {
            // handle error here
        console.log(error)
    }
});

const freeze_card = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    const { cardId, status } = req.body;

    const card = await model.Cards.findOne({
        where: {
            UserId: req.user,
        }
    })

    if(!card) {
        console.log('No Card Found')
        return res.json({
            message: 'No Card found',
        })
    }

    switch(status) {
        case "block":
            const payload = {
                status_action: status, //"block"
                    card_id: cardId, //"e9ca13bd-36b4-4691-9ee6-e23d7f2e196c"
            };
            try {
                const response = await rave.VirtualCards.freeze(payload);
                return res.status(httpStatus.OK).json({
                    success: true,
                    message: "Freeze Card successfully",
                    data: {
                        ...response
                    },
                });
            } catch (error) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    error: error,
                })
            }
        case "unblock":
            const newpayload = {
                status_action:"unblock",
                card_id: cardId,
            };
            try {
                const response = await rave.VirtualCards.unfreeze(newpayload);
                return res.status(httpStatus.OK).json({
                    success: true,
                    message: "UnFreezed Card successfully",
                    data: {
                        ...response
                    },
                });
            } catch (error) {
                return res.status(httpStatus.BAD_REQUEST).json({
                    success: false,
                    error: error,
                })
            }
    }
});

const gift_card = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }
    
    const { id: UserId } = req.user;
    const { cardtype, amount, wallet_email} = req.body;

    // Find the sender by id
    const sender = await findUserById(UserId)
    if(!sender){
        console.log('No User Found')
        return res.json({
            message: 'No User Found',
        })
    }

    // Find Reciever By Email
    const reciever = await findUserByEmail(wallet_email)
    if(!reciever){
        console.log('The Reciever is not Found')
        return res.json({
            message: 'The Reciever is not Found',
        })
    }

    if(sender.id == reciever.id){
        console.log('You can not gift card to yourself')
        return res.json({
            message: 'You can not Gift Card to Yourself',
        })
    }

    // Get User balance 
    const accountDetails = await getUserBalance(UserId);
    const { balance } = accountDetails.dataValues;
    console.log(balance);

    // Logic check before creating card
    const amt = parseFloat(balance);
    console.log('amount', amt);

    const newAmount = amount + fee[cardtype];

    if (amt < newAmount) { // 
        return res.status(403).json({
            message: 'Not Enough Balance to Gift Card',
        });
    }
    
    const fullName = reciever.first_name + reciever.last_name;
    const status = PENDING;
    //Gift Card
    const response = await giftCard(cardtype, reciever.id, amount, fullName, sender.id, req.body.date, status);

    //Update user Balance
    const newBalance = amt - parseFloat(newAmount);
    const update = await model.Accounts.update(
        {
            balance: newBalance,
        },
        {
            where: {
                UserId,
            },
        }
    );
    console.log('update', update);
    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Card Gifted successfully!",
        data: {
            ...response
        },
    });
})

const accept_gift_card = catchAsync(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    const activationLink = req.params.link;
    const check = await model.GiftCards.findOne({
        where:{
            acceptLink: activationLink,
        }
    });

    if (!check) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Incorrect Card Acceptance Code",
        })
    }

    if (req.user.id != check.recipient){
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "You are Not Authorize to Claim This Card",
        })
    }

    if (check.accepted == true){
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Card Already Claimed",
        })
    }

    //Check from gift card table
    const newAmount = check.amount;
    const newcardtype = check.cardtype;

    const {  
        billing_name, 
        billing_address, 
        billing_city, 
        billing_state, 
        billing_postal_code,
        billing_country,
        first_name,
        last_name,
        date_of_birth,
        email,
        phone,
        title,
        gender,
    } = req.body;

    const { id: UserId } = req.user;

    const data = /* JSON.stringify */(
        {
            "currency": "USD",
            "amount": newAmount,
            "debit_currency": "USD",
            "billing_name": billing_name, //"Example User."
            "billing_address": billing_address, //"333, Fremont Street"
            "billing_city": billing_city, //"San Francisco"
            "billing_state": billing_state, //"CA"
            "billing_postal_code": billing_postal_code, //"94105"
            "billing_country": billing_country, //"US"
            "first_name": first_name,
            "last_name": last_name,
            "date_of_birth": date_of_birth, //"1996/12/30"
            "email": email, //"userg@example.com"
            "phone": phone, //"07030000000"
            "title": title, //"MR"
            "gender": gender, //"M"
            "callback_url": process.env.CALLBACKURL,//"https://webhook.site/b67965fa-e57c-4dda-84ce-0f8d6739b8a5"
        }
    )

    // Find the user by id
    const user = await findUserById(UserId)
    if(!user){
        console.log('No User Found')
        return res.json({
            message: 'No User Found',
        })
    }

    
    //Gift Card
    const response = await createCard(data, newcardtype, UserId);
    const status = COMPLETED
    // Update GiftCard table to accepted
    await model.GiftCards.update({
        accepted:true, 
        expiresIn: null, 
        expired: true,
        status: status, 
    },{
        where: {
            acceptLink: activationLink,
        }
    });
    
    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Card Gifted successfully!",
        data: {
            ...response
        },
    });
})

const reject_gift_card = catchAsync(async() => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(httpStatus.BAD_REQUEST).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    //Logic Check
    const activationLink = req.params.link;
    const check = await model.GiftCard.findOne({
        where:{
            acceptLink: activationLink,
        }
    });

    if (!check) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Incorrect Card Rejection Code",
        })
    }

    if (req.user.id != check.recipient){
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "You are Not Authorize to Reject This Card",
        })
    }

    if (check.accepted == true){
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Card Already Claimed",
        })
    }

    if (check.expired == true){
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            message: "Card Has Already Expired",
        })
    }

    //Check from gift card table
    const newcardtype = check.cardType;
    const newAmount = check.amount + fee[newcardtype];
    const gifterId = check.UserId;
    const status = REJECTED;
    const response = await rejectCard(newAmount, gifterId, activationLink, status)

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Card Rejected successfully!",
        data: {
            ...response
        },
    });

});

const get_all_user_gift_card = catchAsync(async (req, res) => {
    const data = await model.GiftCards.findAll({
        where: {
            recipient: req.user.id,
        }
    });
    return res.status(httpStatus.OK).send({
        success: true,
        message: 'List of all Card Gifted to you',
        result: data,
    });
})

const get_all_card_user_has_gifted = catchAsync(async (req, res) => {
    const data = await model.GiftCards.findAll({
        where: {
            UserId: req.user.id,
        }
    });
    return res.status(httpStatus.OK).send({
        success: true,
        message: 'List of all Card You have Gifted',
        result: data,
    });
})

module.exports = {
    gift_card,
    fund_Vcard,
    list_Vcard,
    get_Vcard,
    fetch_trans_Vcard,
    withdraw_funds,
    pay_Vcard,
    freeze_card,
    create_Vcard,
    accept_gift_card,
    reject_gift_card,
    get_all_user_gift_card,
    get_all_card_user_has_gifted,
}