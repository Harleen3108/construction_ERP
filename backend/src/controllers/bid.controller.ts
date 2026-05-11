import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import Bid from '../models/Bid';
import Tender from '../models/Tender';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/auth';

// Stage 5: Submit technical bid
export const submitTechnicalBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tender: tenderId, technicalDocuments } = req.body;
  const tender = await Tender.findById(tenderId);
  if (!tender) { res.status(404); throw new Error('Tender not found'); }
  if (!['PUBLISHED', 'BIDDING_OPEN'].includes(tender.status)) {
    res.status(400);
    throw new Error('Bidding is not open for this tender');
  }

  let bid = await Bid.findOne({ tender: tenderId, contractor: req.user!._id });
  if (!bid) {
    bid = await Bid.create({
      department: tender.department,
      tender: tenderId,
      contractor: req.user!._id,
      contractorName: req.user!.companyName || req.user!.name,
      technicalDocuments,
      status: 'TECHNICAL_SUBMITTED',
      submittedAt: new Date(),
    });
    tender.bids.push(bid._id);
    await tender.save();
  } else {
    bid.technicalDocuments = technicalDocuments;
    bid.status = 'TECHNICAL_SUBMITTED';
    bid.submittedAt = new Date();
    await bid.save();
  }
  res.status(201).json({ success: true, data: bid });
});

// Stage 5: Submit financial bid (only after technical)
export const submitFinancialBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { quotedAmount, rateAnalysis } = req.body;
  const bid = await Bid.findById(req.params.id);
  if (!bid) { res.status(404); throw new Error('Bid not found'); }
  if (bid.contractor.toString() !== req.user!._id.toString()) {
    res.status(403); throw new Error('Not your bid');
  }
  if (bid.status === 'DRAFT') {
    res.status(400); throw new Error('Submit technical bid first');
  }
  bid.quotedAmount = quotedAmount;
  bid.rateAnalysis = rateAnalysis;
  bid.status = 'FINANCIAL_SUBMITTED';
  await bid.save();
  res.json({ success: true, data: bid });
});

// Stage 6: Technical evaluation
export const technicalEvaluation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { qualified, score, remarks } = req.body;
  const bid = await Bid.findByIdAndUpdate(
    req.params.id,
    {
      technicallyQualified: qualified,
      technicalScore: score,
      technicalRemarks: remarks,
      status: qualified ? 'TECHNICALLY_QUALIFIED' : 'TECHNICALLY_DISQUALIFIED',
      evaluatedBy: req.user!._id,
      evaluatedAt: new Date(),
    },
    { new: true }
  );
  res.json({ success: true, data: bid });
});

// Stage 6: Financial evaluation - auto identifies L1
export const financialEvaluation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tenderId } = req.params;
  const qualified = await Bid.find({
    tender: tenderId,
    technicallyQualified: true,
    quotedAmount: { $exists: true, $ne: null },
  }).sort({ quotedAmount: 1 });

  if (!qualified.length) {
    res.status(400); throw new Error('No technically qualified bids found');
  }

  // Reset and assign ranks
  for (let i = 0; i < qualified.length; i++) {
    qualified[i].rank = i + 1;
    qualified[i].isL1 = i === 0;
    qualified[i].status = 'EVALUATED';
    await qualified[i].save();
  }

  // Mark tender L1
  const tender = await Tender.findByIdAndUpdate(
    tenderId,
    { l1Bid: qualified[0]._id, status: 'EVALUATION' },
    { new: true }
  );

  res.json({
    success: true,
    data: { tender, ranked: qualified, l1: qualified[0] },
  });
});

export const getBidsForTender = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bids = await Bid.find({ tender: req.params.tenderId })
    .populate('contractor', 'name companyName email gstNumber panNumber experienceYears')
    .sort({ rank: 1, quotedAmount: 1 });
  res.json({ success: true, count: bids.length, data: bids });
});

export const getMyBids = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bids = await Bid.find({ contractor: req.user!._id })
    .populate('tender', 'tenderId title estimatedCost status bidSubmissionEndDate')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: bids.length, data: bids });
});
