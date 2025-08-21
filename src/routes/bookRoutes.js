import express from 'express';
import cloudinary from '../lib/cloudinary.js';
import Book from '../models/Book.js'; // Assuming you have a Book model defined
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Importing book controller functions
router.post("/", protectRoute, async (req,res) =>{
    try{
        const { title, caption, rating, image } = req.body;
        
        if (!title || !caption || !rating || !image) {
            return res.status(400).json({ message: "All fields are required" });
        }
        //upload image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;

        // Create a new book object
        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id
        })
        await newBook.save();
        res.status(201).json({ message: "Book created successfully", book: newBook });
    }catch(err){
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/",protectRoute, async(req,res)=>{
    try{

        const page = req.query.page || 1;
        const limit = req.query.limit || 5;
        const skip = (page -1) * limit;
        const books = await Book.find().sort({createdAt:-1}).skip(skip).limit(limit).populate("user","username profileImage");
        const totalBooks = await Book.countDocuments();
        res.send({
            books,
            currentPage:page,
            totalPages:Math.ceil(totalBooks / limit),
            totalBooks,
        });
    }
    catch(error){
        res.status(500).json({message:"Internal server error"});
    }
})

router.delete("/:id",protectRoute, async(req,res)=>{
    try{
        const book = await Book.findById(req.params.id);
        if(!book) return res.status(404).json({message:"Book not found"});

        if(book.user.toString() !== req.user._id.toString())
        {
            return res.status(401).json({message:"Unauthorized"});
        }
        //deleting from cloudinary
        if(book.image && book.image.includes("cloudinary")){
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                console.log("error deleting image from cloudinary",error)
            }
        }
        await book.deleteOne();
        res.json({message:"Book deleted successfully"});
    }
    catch(error){
        res.status(500).json({message:"Internal server error"});
    }
});

router.get("/user",protectRoute,async(req,res)=>{
    try{
        const books = await Book.find({user:req.user._id}).sort({createdAt:-1});
        res.json(books);
    }catch(error){
        console.log("get user books error",error.message);
        res.status(500).json({message:"Internal Search error"});
    }
})

export default router;