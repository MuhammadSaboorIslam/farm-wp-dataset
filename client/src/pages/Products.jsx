import {useEffect,useState} from 'react'
import {useDispatch,useSelector} from 'react-redux';
import {loadProducts,setFilters,resetFilters,CATEGORIES} from '../redux/products'
import ProductCard from '../components/ProductCard';
import {Loader,ErrorMsg,Icon} from '../components/Bits'

function Products(){
  const dispatch = useDispatch()
  const {list,page,loading,error,filters}=useSelector(state =>state.products)
  const [text,setText]=useState(filters.q)
  const [location,setLocation]=useState(filters.location)
  const [minPrice,setMinPrice]=useState(filters.minPrice)
  const [maxPrice,setMaxPrice]=useState(filters.maxPrice)

  useEffect(()=>{
    dispatch(loadProducts(filters))
  },[dispatch,filters])

  function search(e){
    e.preventDefault()
    dispatch(setFilters({q: text.trim()}))
  }

  function clearsearch(){
    setText('')
    dispatch(setFilters({ q: '' }))
  }

  function changefilter(e) {
    dispatch(setFilters({ [e.target.name]: e.target.value}))
  }

  function applyText(name, value){
    if (value.trim() !== filters[name]){
      dispatch(setFilters({ [name]: value.trim() }))
    }
  }

  function onEnter(e, name, value){
    if (e.key === 'Enter'){
      applyText(name, value)
    }
  }

  function reset(){
    setText('')
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
    dispatch(resetFilters());
  }

  function ChangePage(p) {
    dispatch(setFilters({ page:p }))
  }

  const active = filters.q || filters.category || filters.location || filters.minPrice || filters.maxPrice || filters.sort !== 'newest'

  let heading = 'Fresh from the farm'
  if(filters.q){
    heading='Results for "' + filters.q + '"'
  }else if (filters.category) {
    heading=filters.category
  }

  const catOptions = []
  for (let i = 0; i < CATEGORIES.length; i++){
    catOptions.push(<option key={CATEGORIES[i]} value={CATEGORIES[i]}>{CATEGORIES[i]}</option>)
  }

  const cards = []
  for (let i = 0; i < list.length; i++){
    cards.push(<ProductCard key={list[i].id} product={list[i]} />)
  }

  const TITLE = 'Fresh food, straight from the farm'.split(' ')
  const words = []
  for (let i = 0; i < TITLE.length; i++){
    words.push(<span key={i} className="rise inline-block mr-[0.3em]" style={{ animationDelay: (i * 0.1) + 's' }}>{TITLE[i]}</span>)
  }

  return (
      <div>
      <div className="hero">
        <div className="absolute inset-0 pattern"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-10 w-96 h-96 rounded-full bg-lime-300/20 blur-3xl"></div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/15 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{words}</h1>
          <p className="text-green-100 text-lg mt-4 rise" style={{ animationDelay: '0.6s' }}>Buy directly from farmers near you. No middlemen, picked the day before delivery.</p>
          <form className='searchbar rise' style={{ animationDelay: '0.8s' }} onSubmit={search}>
            <Icon name="search" className="w-5 h-5 ml-2" />
            <input
              type="text"
              className="searchinput"
              placeholder="Search products..."
              value={text}
               onChange={e => setText(e.target.value)}
            />
           {text && <button type="button" className="text-gray-400 hover:text-gray-600 px-2 cursor-pointer" onClick={clearsearch}>Clear</button>}
            <button type="submit" className="btn rounded-full px-6">Search</button>
          </form>
        </div>
      </div>

      <div className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
        <label className="label mb-0">
           Category
            <select name="category" className="input" value={filters.category} onChange={changefilter}>
              <option value="">All</option>
            {catOptions}
            </select>
        </label>

        <label className="label mb-0">
          Min price
          <input type="number" min="0" className="input" value={minPrice} placeholder="0"
            onChange={e => setMinPrice(e.target.value)}
            onBlur={() => applyText('minPrice', minPrice)}
            onKeyDown={e => onEnter(e, 'minPrice', minPrice)} />
        </label>

        <label className="label mb-0">
          Max price
          <input type="number" min="0" className="input" value={maxPrice} placeholder="any"
            onChange={e => setMaxPrice(e.target.value)}
            onBlur={() => applyText('maxPrice', maxPrice)}
            onKeyDown={e => onEnter(e, 'maxPrice', maxPrice)} />
        </label>

        <label className="label mb-0">
          Location
           <input className="input" value={location} placeholder='e.g. Lahore'
            onChange={e =>setLocation(e.target.value)}
            onBlur={() => applyText('location', location)}
            onKeyDown={e => onEnter(e, 'location', location)} />
        </label>

        <label className="label mb-0">
            Sort by
          <select name='sort' className="input" value={filters.sort} onChange={changefilter}>
            <option value="newest">Newest</option>
            <option value="price,asc">Price (low to high)</option>
            <option value="price,desc">Price (high to low)</option>
            <option value="name,asc">Name (A-Z)</option>
          </select>
          </label>

            {active && <button type="button" className="btn-ghost col-span-2 md:col-span-5 justify-self-start" onClick={reset}>Reset filters</button>}
     </div>

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xl font-bold">{heading}</h2>
        {!loading && !error && <span className="muted">{page.totalElements} products</span>}
      </div>

          {loading && <Loader />}
      {error && <ErrorMsg message={error} />}

      {!loading && !error && list.length===0&&(
          <p className="empty">No products found.</p>
        )}

      {!loading && !error && list.length > 0 && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards}
        </div>

          {page.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
            <button className="btn" disabled={page.number <= 0} onClick={() =>ChangePage(page.number - 1)}>Prev</button>
             <span className="text-sm">Page {page.number+1} of {page.totalPages}</span>
            <button className="btn" disabled={page.number+1 >= page.totalPages} onClick={()=>ChangePage(page.number+1)}>Next</button>
          </div>
        )}
          </>
      )}
          </div>
  )
}

export default Products;
