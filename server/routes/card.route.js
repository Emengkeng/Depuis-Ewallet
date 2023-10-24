import express from 'express';
import {
    
    list_Vcard,
    create_Vcard,
    fund_Vcard,
    pay_Vcard,
    get_Vcard,
    fetch_trans_Vcard,
    withdraw_funds,
    freeze_card,
    gift_card,
    accept_gift_card,
    reject_gift_card,
} from '../controllers/card/card.controller';
const { auth } = require("../middlewares/auth/auth");
const {authAdmin} = require("../middlewares/auth/auth-admin");
const { cardValidation } = require('../validations')

const router = express.Router();

router.get('/card/listcard', [auth, authAdmin], list_Vcard);

router.post('/card/createcard', [auth, cardValidation.createCard], create_Vcard);

//still need working in controller
router.post('/card/fundcard', [auth], fund_Vcard);

router.post('/card/pay', [auth, authAdmin], pay_Vcard);

    // Get a single card by id
router.get('/card/getcard', [auth], get_Vcard);

router.get('/card/fetch_transcard', [auth], fetch_trans_Vcard);

router.post('/card/withdraw', [auth], withdraw_funds);

router.post('/card/freezecard', [auth], freeze_card);

router.post('/card/giftcard', [auth], gift_card);

router.post('/card/acceptcard', [auth], accept_gift_card);

router.post('/card/rejectgift', [auth], reject_gift_card);


module.exports = router;