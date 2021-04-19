const Product = require('../models/product')
const slugify = require('slugify')
const Category = require('../models/category')

exports.createProduct = (req, res) => {
  const { name, price, description, category, quantity } = req.body
  let productPictures = []

  if (req.files.length > 0) {
    productPictures = req.files.map(file => ({
      img: file.filename
    }))
  }

  const product = new Product({
    name,
    slug: slugify(name),
    price,
    quantity,
    description,
    productPictures,
    category,
    createdBy: req.user._id
  })

  product.save((error, product) => {
    if (error) return res.status(400).json({ error })
    res.status(201).json({ product })
  })
}

exports.getProductsBySlug = (req, res) => {
  const { slug } = req.params
  Category.findOne({ slug })
    .select('_id type')
    .exec((error, category) => {
      if (error) return res.status(400).json({ error })

      if (category) {
        Product.find({ category: category._id }).exec((error, products) => {
          if (error) return res.status(400).json({ error })

          if (products.length > 0) {
            res.status(200).json({
              products,
              priceRange: {
                under5k: 5000,
                under10k: 10000,
                under15k: 15000,
                under20k: 20000,
                under25k: 25000
              },
              productsByPrice: {
                under5k: products.filter(product => product.price <= 5000),
                under10k: products.filter(
                  product => product.price > 5000 && product.price <= 10000
                ),
                under15k: products.filter(
                  product => product.price > 10000 && product.price <= 15000
                ),
                under20k: products.filter(
                  product => product.price > 15000 && product.price <= 20000
                ),
                under30k: products.filter(
                  product => product.price > 20000 && product.price <= 30000
                )
              }
            })
          } else res.status(200).json({ products })
        })
      }
    })
}

exports.getProductDetailsById = (req, res) => {
  const { productId } = req.params
  if (productId) {
    Product.findOne({ _id: productId }).exec((error, product) => {
      if (error) return res.status(400).json({ error })

      res.status(200).json({ product })
    })
  } else return res.status(400).json({ error: 'Params required' })
}

exports.deleteProductById = (req, res) => {
  const { productId } = req.body.payload
  if (productId) {
    Product.deleteOne({ _id: productId }).exec((error, result) => {
      if (error) return res.status(400).json({ error })

      res.status(202).json({ result })
    })
  } else res.status(400).json({ error: 'Params required' })
}

exports.getProducts = async (req, res) => {
  const products = await Product.find({})
    .select('_id name price quantity slug description productPictures category')
    .populate({ path: 'category', select: '_id name' })
    .exec()

  res.status(200).json({ products })
}