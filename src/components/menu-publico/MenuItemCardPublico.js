import Image from "next/image";

const PlaceholderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-300">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.158 0a.225.225 0 0 1 .225.225V8.7a.225.225 0 0 1-.45 0V8.475a.225.225 0 0 1 .225-.225Z" />
  </svg>
);

export default function MenuItemCardPublico({ item, corPrincipal }) {

  const nomesDosGrupos = item.tem_opcoes && item.grupos_opcoes?.length > 0
    ? item.grupos_opcoes.map(g => g.nome).join(' • ')
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex h-full">
      
      <div className="relative w-1/3 flex-shrink-0 bg-gray-50 flex items-center justify-center">
        {item.foto ? (
          <Image
            src={item.foto}
            alt={item.nome}
            layout="fill"
            objectFit="cover"
          />
        ) : (
          <PlaceholderIcon />
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="text-lg font-bold text-gray-800">{item.nome}</h4>
        <p className="text-sm text-gray-600 mt-1 flex-grow">{item.descricao}</p>
        
        {nomesDosGrupos && (
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-700">Personalizável com:</span> {nomesDosGrupos}
            </p>
          </div>
        )}

        <div className="flex justify-end items-center mt-4">
          <p className="text-lg font-bold" style={{ color: corPrincipal }}>
            R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
    </div>
  );
}