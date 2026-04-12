const { generateToken } = require("../utils/jwt");


const register = (req, res) => {
    const { name, email, password, hospital } = req.body;

    if(!name || !email || !password || !hospital) {
        return res.status(400).json({ message: "All fields are required" });
    }

    doctor.create({ name, email, password, hospital }).then(doc => {
        res.json({ message: "Registration successful", doctor: doc });
    }).catch(err => {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    });
};


const login = async (req, res) => {
    const { email, password } = req.body;

    const doc = await doctor.findOne({ email });

    if(!doc) {
        return res.status(404).json({ message: "Doctor not found" });
    }

    if(doc.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(
        { id: doc._id, email: doc.email },
        "doctor"
    );

    res.json({
        message: "Login successful",
        doctor: doc,
        token
    });
};


const change_hospital = (req, res) => {
    const { doctorId, newHospitalId } = req.body;

    if(!doctorId || !newHospitalId) {
        return res.status(400).json({ message: "Doctor ID and new Hospital ID are required" });
    }

    doctor.findByIdAndUpdate(doctorId, { hospital: newHospitalId }, { new: true }).then(doc => {
        if(!doc) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json({ message: "Hospital updated successfully", doctor: doc });
    }).catch(err => {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    });
};

const getProfile = (req, res) => {
    const doctorId = req.doctor._id;

    doctor.findById(doctorId).then(doc => {
        if(!doc) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        res.json({ doctor: doc });
    }).catch(err => {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    });     
};

const changePassword = (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const doctorId = req.doctor._id;

    if(!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
    }

    doctor.findById(doctorId).then(doc => {
        if(!doc) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if(doc.password !== currentPassword) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        doc.password = newPassword;
        return doc.save();
    }).then(updatedDoc => {
        res.json({ message: "Password changed successfully", doctor: updatedDoc });
    }).catch(err => {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    });
};

module.exports = { login, register, change_hospital, getProfile, changePassword };