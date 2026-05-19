import { stories } from '../data/homeContent'
import { HomeAvatar } from './HomeAvatar'

export function Stories() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {stories.map((story, index) => (
        <button key={story.name} className="group relative h-48 overflow-hidden rounded-xl bg-gray-200 text-left shadow-sm ring-1 ring-gray-200">
          <img src={story.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute left-3 top-3">
            {index === 0 ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-xl font-bold text-white">+</div>
            ) : (
              <HomeAvatar name={story.name} size="h-9 w-9" />
            )}
          </div>
          <p className="absolute bottom-3 left-3 right-3 text-sm font-bold leading-tight text-white">{story.name}</p>
        </button>
      ))}
    </div>
  )
}
