var jwt = require('jsonwebtoken');
const User = require('../models/emp');
const controller = require('../controllers/emp');
const PRIVATE_KEY = '123456';

exports.encode = async (req, res, next) => {
    console.log('1',req.params)
    try{
        if(req.params){
            const userId  = req.params;
            const empDetails = await controller.findById(userId);
            console.log(empDetails,'PPP');
            const payload = {
                email: empDetails.email,
                role: empDetails.role,
            };
            const authToken = jwt.sign(payload, PRIVATE_KEY);
            console.log('Auth', authToken);
            req.authToken = authToken;
            next();
        }
    }
    catch(error){
        return res.status(400).json({ success: false, message: error.error });
    } 
}

exports.encode1 = async (req, res, next) => {
    console.log('1',req.body)
    try{
        if(req){
            const email  = req.body.email;
            const role = req.body.role;
            var data = { email:email, role: role };
            const empDetails = await controller.findByEmail(data);
            console.log(empDetails,'PPP');
            const payload = {
                email: empDetails.email,
                role: empDetails.role,
            };
            const authToken = jwt.sign(payload, PRIVATE_KEY);
            console.log('Auth', authToken);
            req.authToken = authToken;
            req.username = empDetails.name;
            next();
        }
    }
    catch(error){
        return res.status(400).json({ success: false, message: error.error });
    } 
}

exports.decode = async(req, res, next) => {
    if (!req.headers['authorization']) {
        return res.status(400).json({ success: false, message: 'No access token provided' });
    }
    const accessToken = req.headers.authorization.split(' ')[1];
    try{
        const decoded = jwt.verify(accessToken, PRIVATE_KEY);
        // req.email = decoded.email;
        req.admin = decoded.role;
        console.log('decodeddd',req.body)
        return next();
    }
    catch(error){
        return res.status(401).json({ success: false, message: error.message });
    }
}