-- Permitir que qualquer participante delete a sala (não apenas o host)
DROP POLICY IF EXISTS "Hosts can delete their parties" ON public.watch_parties;
CREATE POLICY "Participants can delete parties"
ON public.watch_parties
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM watch_party_participants
    WHERE watch_party_participants.party_id = watch_parties.id
    AND watch_party_participants.user_id = auth.uid()
  )
);

-- Permitir que qualquer participante atualize a sala (para soft delete)
DROP POLICY IF EXISTS "Hosts can update their parties" ON public.watch_parties;
CREATE POLICY "Participants can update parties"
ON public.watch_parties
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM watch_party_participants
    WHERE watch_party_participants.party_id = watch_parties.id
    AND watch_party_participants.user_id = auth.uid()
  )
);

-- Adicionar política para participantes deletarem mensagens
CREATE POLICY "Participants can delete messages"
ON public.watch_party_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM watch_party_participants
    WHERE watch_party_participants.party_id = watch_party_messages.party_id
    AND watch_party_participants.user_id = auth.uid()
  )
);

-- Permitir que participantes deletem outros participantes (para limpeza ao encerrar sala)
CREATE POLICY "Participants can delete other participants"
ON public.watch_party_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM watch_party_participants AS p
    WHERE p.party_id = watch_party_participants.party_id
    AND p.user_id = auth.uid()
  )
);