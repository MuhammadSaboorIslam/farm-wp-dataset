import {useEffect,useState} from 'react'
import {useParams,useNavigate,Link} from 'react-router-dom'
import {useDispatch,useSelector} from 'react-redux'
import {createProduct,updateProduct,loadMyProducts,clearSaveError,CATEGORIES,UNITS} from '../redux/products'
import {flash} from '../redux/ui'
import {readFiles} from '../helpers'
import {Loader} from '../components/Bits'

function Form({ initial }){
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { saving, saveError } = useSelector(state => state.products)
  const [name, setName] = useState(initial ? initial.name : '')
  const [description, setDescription] = useState(initial ? initial.description : '')
  const [category, setCategory] = useState(initial ? initial.category : CATEGORIES[0])
  const [price, setPrice] = useState(initial ? initial.price : '')
  const [quantity, setQuantity] = useState(initial ? initial.quantity : '')
  const [unit, setUnit] = useState(initial ? initial.unit : UNITS[0])
  const [images, setImages] = useState(initial ? initial.images : [])
  const [formerror, setFormerror] = useState('')

  async function pickImages(e){
    const urls = await readFiles(e.target.files)
    setImages(images.concat(urls))
  }

  async function submit(e){
    e.preventDefault()
    if (!name.trim()){
      setFormerror('Product needs a name')
      return
    }
    if (!(Number(price) > 0)){
      setFormerror('Price should be more than 0')
      return
    }
    if (!(Number(quantity) >= 0)){
      setFormerror('Quantity cannot be negative')
      return
    }
    setFormerror('')
    const form = { name: name.trim(), description: description.trim(), category, price: Number(price), quantity: Number(quantity), unit, images }
    let result
    if (initial){
      result = await dispatch(updateProduct({ id: initial.id, form: form }))
    } else {
      result = await dispatch(createProduct(form))
    }
    if (!result.error){
      flash(dispatch, 'ok', initial ? 'Product updated' : name + ' is now listed')
      navigate('/farmer')
    }
  }

  const catOptions = []
  for (let i = 0; i < CATEGORIES.length; i++){
    catOptions.push(<option key={CATEGORIES[i]} value={CATEGORIES[i]}>{CATEGORIES[i]}</option>)
  }
  const unitOptions = []
  for (let i = 0; i < UNITS.length; i++){
    unitOptions.push(<option key={UNITS[i]} value={UNITS[i]}>{UNITS[i]}</option>)
  }
  const previews = []
  for (let i = 0; i < images.length; i++){
    const n = i
    previews.push(<img key={n} src={images[n]} alt="" className="w-20 h-20 object-cover rounded cursor-pointer" title="Click to remove" onClick={() => setImages(images.filter((x, j) => j !== n))} />)
  }

  return (
    <form onSubmit={submit}>
      <label className="label">Name
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tomatoes" />
      </label>
      <label className="label">Description
        <textarea rows="3" className="input" value={description} onChange={e => setDescription(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="label">Category
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>{catOptions}</select>
        </label>
        <label className="label">Unit
          <select className="input" value={unit} onChange={e => setUnit(e.target.value)}>{unitOptions}</select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="label">Price per {unit} (Rs)
          <input type="number" min="1" className="input" value={price} onChange={e => setPrice(e.target.value)} />
        </label>
        <label className="label">Quantity available
          <input type="number" min="0" className="input" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </label>
      </div>
      <label className="label">Photos
        <input type="file" accept="image/*" multiple className="input" onChange={pickImages} />
      </label>
      <div className="flex gap-2 flex-wrap mb-2">{previews}</div>
      {previews.length > 0 && <p className="muted mb-3">Click a photo to remove it.</p>}
      {(formerror || saveError) && <p className="err">{formerror || saveError}</p>}
      <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving...' : (initial ? 'Save changes' : 'List product')}</button>
    </form>
  )
}

function ProductForm(){
  const { id } = useParams()
  const dispatch = useDispatch()
  const { mine, mineLoading } = useSelector(state => state.products)

  useEffect(() => {
    dispatch(clearSaveError())
    if (id && mine.length === 0){
      dispatch(loadMyProducts())
    }
  }, [dispatch, id, mine.length])

  let product = null
  for (let i = 0; i < mine.length; i++){
    if (mine[i].id === id){
      product = mine[i]
    }
  }

  return (
    <div className="card max-w-2xl mx-auto p-6">
      <p className="text-sm mb-2"><Link to="/farmer" className="link">&larr; Back to dashboard</Link></p>
      <h2 className="text-2xl font-bold mb-4">{id ? 'Edit product' : 'New product'}</h2>
      {id && mineLoading && <Loader />}
      {id && !mineLoading && !product && mine.length > 0 && <p className="err">That product is not yours or does not exist.</p>}
      {(!id || product) && <Form key={id || 'new'} initial={product} />}
    </div>
  )
}

export default ProductForm
