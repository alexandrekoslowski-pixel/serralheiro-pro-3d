CREATE OR REPLACE FUNCTION private.importar_material_catalogo(_itens jsonb, _arquivo text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _item jsonb; _material_id uuid; _total integer := 0;
BEGIN
  FOR _item IN SELECT * FROM jsonb_array_elements(_itens)
  LOOP
    INSERT INTO public.materiais(
      user_id,codigo_fornecedor,nome,descricao_original,categoria,subtipo,unidade,unidade_compra,
      comprimento_comercial_mm,largura_mm,espessura_mm,acabamento,fornecedor,observacoes,ativo
    ) VALUES (
      'ed847f0d-c26e-49af-803e-38ea0bdf73a1'::uuid,_item->>'code',_item->>'name',_item->>'name',_item->>'category',
      COALESCE(_item->>'group',''),_item->>'unit',_item->>'unit',(_item->>'commercial')::numeric,
      (_item->>'width')::numeric,(_item->>'thickness')::numeric,COALESCE(_item->>'finish',''),'R.B Comércio de Aços',
      'Saldo informado em 31/08/2026: '||COALESCE(_item->>'balance','—')||'. Não representa estoque interno.',true
    ) ON CONFLICT (user_id,fornecedor,codigo_fornecedor) WHERE codigo_fornecedor <> '' DO UPDATE SET
      nome=excluded.nome,descricao_original=excluded.descricao_original,categoria=excluded.categoria,subtipo=excluded.subtipo,
      unidade=excluded.unidade,unidade_compra=excluded.unidade_compra,comprimento_comercial_mm=excluded.comprimento_comercial_mm,
      largura_mm=excluded.largura_mm,espessura_mm=excluded.espessura_mm,acabamento=excluded.acabamento,
      observacoes=excluded.observacoes,ativo=true
    RETURNING id INTO _material_id;
    INSERT INTO public.material_precos(user_id,material_id,fornecedor,valor,unidade,referencia,origem,observacoes)
    VALUES ('ed847f0d-c26e-49af-803e-38ea0bdf73a1'::uuid,_material_id,'R.B Comércio de Aços',(_item->>'price')::numeric,
      _item->>'unit','2026-08-31',_arquivo,'Saldo informado em 31/08/2026: '||COALESCE(_item->>'balance','—')||'. Não representa estoque interno.')
    ON CONFLICT (material_id,fornecedor,referencia) DO UPDATE SET valor=excluded.valor,unidade=excluded.unidade,origem=excluded.origem,observacoes=excluded.observacoes;
    _total := _total + 1;
  END LOOP;
  RETURN _total;
END;
$$;
REVOKE ALL ON FUNCTION private.importar_material_catalogo(jsonb,text) FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO sandbox_exec;
GRANT EXECUTE ON FUNCTION private.importar_material_catalogo(jsonb,text) TO sandbox_exec;