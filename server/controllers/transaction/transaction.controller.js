const { getTransactions } = require("../../services/transaction/transaction.service");
const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchasync");

const getTransaction = catchAsync(async (req, res) => {
  const transactionData = {
    UserId: req.user.id,
    limit: req.query.limit,
    page: req.query.page,
  };
  const transactions = await getTransactions(transactionData);

  return res.status(httpStatus.OK).send({
    success: true,
    message: "Returned transactions successfully",
    result: transactions,
  });
});

module.exports = {
  getTransaction,
};
