import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

const saveEditorState = () => {

}

export default function DiagramSection() {
  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 z-10 ">
        <Tldraw
          components={{
            StylePanel: () => null,
          }}
          className="border-t border-zinc-300 opacity-80 "
        />
      </div>
    </div>
  );
}


