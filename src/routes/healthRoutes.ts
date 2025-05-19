import { Router } from "express";

const router = Router();


router.get('/status', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router;